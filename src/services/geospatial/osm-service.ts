import {
  Coordinate,
  LocationSearchResult,
  GeoRoadSegment,
  MobilityIntersection,
  DataProvenance,
} from '@/types/geospatial';
import {
  computeBoundingBox,
  haversineDistanceMeters,
  cleanLocationName,
  slugify,
  estimateRoadLengthMeters,
} from './geo-utils';
import { geoCache } from '@/lib/cache/geo-cache';
import {
  SEEDED_LOCATION_CANDIDATES,
  SEEDED_MOBILITY_ZONES,
} from '@/data/mobility-zones-seed';

export interface RoadNetworkResult {
  roads: GeoRoadSegment[];
  intersections: MobilityIntersection[];
  pois: Array<{ name: string; type: string; coordinate: Coordinate }>;
  source: 'osm' | 'seed';
  provenance: DataProvenance;
}

export interface GeoProvider {
  name: string;
  geocode(query: string, limit?: number): Promise<LocationSearchResult[]>;
  getRoadNetwork(center: Coordinate, radiusMeters: number): Promise<RoadNetworkResult>;
}

export class OSMGeoProvider implements GeoProvider {
  public readonly name = 'OpenStreetMap';

  private nominatimUrl =
    process.env.OSM_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
  private overpassUrl =
    process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
  private userAgent = 'NIU-UrbanMobility/1.0 (contact: support@niu-mobility.org)';

  /**
   * Geocode a human-readable query into candidate geographic locations
   */
  public async geocode(query: string, limit = 5): Promise<LocationSearchResult[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const cacheKey = `geocoding:${trimmed}:${limit}`;
    const cached = geoCache.get<LocationSearchResult[]>(cacheKey);
    if (cached) return cached;

    // First, check local seed candidates for exact or high-affinity matches
    const seedMatches = SEEDED_LOCATION_CANDIDATES.filter(
      (item) =>
        item.name.toLowerCase().includes(trimmed) ||
        item.displayName.toLowerCase().includes(trimmed) ||
        trimmed.includes(item.id.replace(/-/g, ' '))
    );

    const exactSeedMatch = seedMatches.find(
      (item) =>
        item.name.toLowerCase() === trimmed ||
        item.id.toLowerCase() === trimmed ||
        item.id.replace(/-/g, ' ').toLowerCase() === trimmed
    );
    if (exactSeedMatch) {
      geoCache.set(cacheKey, [exactSeedMatch], 3600);
      return [exactSeedMatch];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `${this.nominatimUrl}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const results: LocationSearchResult[] = data.map((item) => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const bb = item.boundingbox
              ? {
                  minLat: parseFloat(item.boundingbox[0]),
                  maxLat: parseFloat(item.boundingbox[1]),
                  minLng: parseFloat(item.boundingbox[2]),
                  maxLng: parseFloat(item.boundingbox[3]),
                }
              : computeBoundingBox({ latitude: lat, longitude: lng }, 1000);

            return {
              id: slugify(item.display_name.split(',')[0] || item.name || `loc-${lat}-${lng}`),
              name: item.name || cleanLocationName(item.display_name),
              displayName: item.display_name,
              latitude: lat,
              longitude: lng,
              type: item.type || item.class || 'location',
              importance: item.importance ? parseFloat(item.importance) : 0.5,
              source: 'osm',
              boundingBox: bb,
            };
          });

          // Prepend high-confidence seed match if relevant
          const combined = [...seedMatches, ...results.filter((r) => !seedMatches.some((s) => s.id === r.id))];
          geoCache.set(cacheKey, combined, 3600); // 1 hour TTL
          return combined.slice(0, limit);
        }
      }
    } catch {
      // Nominatim unreachable or timed out -> Fall back gracefully to seeds
    }

    if (seedMatches.length > 0) {
      geoCache.set(cacheKey, seedMatches, 3600);
      return seedMatches.slice(0, limit);
    }

    // Default fallback: return Greater Noida core candidate if nothing else found
    return SEEDED_LOCATION_CANDIDATES.slice(0, 1);
  }

  /**
   * Retrieves road network and intersections for a bounded geographic area
   */
  public async getRoadNetwork(
    center: Coordinate,
    radiusMeters: number
  ): Promise<RoadNetworkResult> {
    const clampedRadius = Math.min(Math.max(radiusMeters, 400), 2500); // Guard bounded query size
    const cacheKey = `osm_network:${center.latitude.toFixed(4)},${center.longitude.toFixed(4)},${clampedRadius}`;
    const cached = geoCache.get<RoadNetworkResult>(cacheKey);
    if (cached) return cached;

    // Check if within 2.5 km of a seeded calibrated zone
    for (const seedZone of SEEDED_MOBILITY_ZONES) {
      const dist = haversineDistanceMeters(center, seedZone.center);
      if (dist <= 2500) {
        const seedResult: RoadNetworkResult = {
          roads: seedZone.roads,
          intersections: seedZone.intersections,
          pois: [
            {
              name: seedZone.name,
              type: 'educational_or_commercial_hub',
              coordinate: seedZone.center,
            },
          ],
          source: 'seed',
          provenance: seedZone.provenance,
        };
        geoCache.set(cacheKey, seedResult, 86400); // 24 hours
        return seedResult;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const lat = center.latitude;
      const lon = center.longitude;

      // Bounded Overpass query for highways and amenities
      const overpassQuery = `
        [out:json][timeout:5];
        (
          way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|service"](around:${clampedRadius},${lat},${lon});
          node["amenity"~"university|college|school|hospital"](around:${clampedRadius},${lat},${lon});
        );
        out body geom;
      `;

      const response = await fetch(this.overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const parsed = this.parseOverpassElements(data.elements || [], center);
        if (parsed.roads.length > 0) {
          const result: RoadNetworkResult = {
            ...parsed,
            source: 'osm',
            provenance: {
              source: 'osm',
              confidence: 0.9,
              freshness: new Date().toISOString(),
              notes: `Live OpenStreetMap road geometry via Overpass API within ${clampedRadius}m radius.`,
              provider: 'OpenStreetMap Contributors',
            },
          };
          geoCache.set(cacheKey, result, 86400);
          return result;
        }
      }
    } catch {
      // Overpass unavailable or timed out -> Fall back to synthetic road generation
    }

    // Fallback: Generate a realistic synthetic topological grid anchored to the requested coordinate
    const fallbackNetwork = this.generateSyntheticRoadGrid(center, clampedRadius);
    geoCache.set(cacheKey, fallbackNetwork, 3600);
    return fallbackNetwork;
  }

  /**
   * Parses Overpass response elements into normalized NIU road segments and intersections
   */
  private parseOverpassElements(
    elements: Array<Record<string, unknown>>,
    center: Coordinate
  ): {
    roads: GeoRoadSegment[];
    intersections: MobilityIntersection[];
    pois: Array<{ name: string; type: string; coordinate: Coordinate }>;
  } {
    const roads: GeoRoadSegment[] = [];
    const intersections: MobilityIntersection[] = [];
    const pois: Array<{ name: string; type: string; coordinate: Coordinate }> = [];

    // Track intersection candidates by coordinate key
    const coordUsage = new Map<string, { lat: number; lng: number; roadIds: string[] }>();

    for (const elem of elements) {
      if (elem.type === 'node' && elem.tags) {
        const tags = elem.tags as Record<string, string>;
        if (tags.amenity && typeof elem.lat === 'number' && typeof elem.lon === 'number') {
          pois.push({
            name: tags.name || `${tags.amenity.toUpperCase()} Facility`,
            type: tags.amenity,
            coordinate: { latitude: elem.lat, longitude: elem.lon },
          });
        }
      } else if (elem.type === 'way' && elem.geometry && elem.tags) {
        const tags = elem.tags as Record<string, string>;
        const geom = elem.geometry as Array<{ lat: number; lon: number }>;
        if (Array.isArray(geom) && geom.length >= 2) {
          const coords: Coordinate[] = geom.map((g) => ({
            latitude: g.lat,
            longitude: g.lon,
          }));

          const roadId = `osm-way-${elem.id}`;
          const roadName = tags.name || `${tags.highway ? tags.highway.toUpperCase() : 'Arterial'} Link`;
          const lanes = tags.lanes ? parseInt(tags.lanes, 10) : tags.highway === 'motorway' || tags.highway === 'trunk' ? 3 : 2;
          const maxSpeed = tags.maxspeed ? parseInt(tags.maxspeed, 10) : tags.highway === 'motorway' ? 80 : 50;

          roads.push({
            id: roadId,
            name: roadName,
            coordinates: coords,
            highwayType: tags.highway || 'secondary',
            lanes: isNaN(lanes) ? 2 : lanes,
            maxSpeedKph: isNaN(maxSpeed) ? 50 : maxSpeed,
            oneWay: tags.oneway === 'yes',
            source: 'osm',
            lengthMeters: estimateRoadLengthMeters(coords),
          });

          // Mark start and end nodes as intersection candidates
          const start = coords[0];
          const end = coords[coords.length - 1];

          for (const pt of [start, end]) {
            const key = `${pt.latitude.toFixed(4)},${pt.longitude.toFixed(4)}`;
            const existing = coordUsage.get(key);
            if (existing) {
              if (!existing.roadIds.includes(roadId)) existing.roadIds.push(roadId);
            } else {
              coordUsage.set(key, { lat: pt.latitude, lng: pt.longitude, roadIds: [roadId] });
            }
          }
        }
      }
    }

    // Convert multi-road or key points into MobilityIntersections
    let interIdx = 1;
    for (const [key, node] of coordUsage.entries()) {
      if (node.roadIds.length >= 1) {
        intersections.push({
          id: `inter-${interIdx++}`,
          name: `Junction ${key}`,
          latitude: node.lat,
          longitude: node.lng,
          connectedRoadIds: node.roadIds,
          source: 'osm',
          trafficSignal: node.roadIds.length >= 2,
          type: node.roadIds.length >= 3 ? 'crossroad' : 'junction',
        });
      }
      if (intersections.length >= 10) break; // Keep manageable node count
    }

    // If no explicit intersections parsed, anchor a primary center node
    if (intersections.length === 0) {
      intersections.push({
        id: 'inter-center',
        name: 'Zone Central Crossing',
        latitude: center.latitude,
        longitude: center.longitude,
        connectedRoadIds: roads.slice(0, 3).map((r) => r.id),
        source: 'osm',
        trafficSignal: true,
        type: 'roundabout',
      });
    }

    return { roads: roads.slice(0, 30), intersections, pois };
  }

  /**
   * Generates a deterministic synthetic road grid when Overpass is offline
   */
  private generateSyntheticRoadGrid(
    center: Coordinate,
    radiusMeters: number
  ): RoadNetworkResult {
    const lat = center.latitude;
    const lng = center.longitude;
    const delta = radiusMeters / 111320;

    const roads: GeoRoadSegment[] = [
      {
        id: 'syn-rd-main-ns',
        name: 'Main Arterial Corridor (North-South)',
        coordinates: [
          { latitude: lat - delta * 0.8, longitude: lng },
          { latitude: lat, longitude: lng },
          { latitude: lat + delta * 0.8, longitude: lng },
        ],
        highwayType: 'primary',
        lanes: 3,
        maxSpeedKph: 60,
        oneWay: false,
        source: 'seed',
        lengthMeters: Math.round(radiusMeters * 1.6),
      },
      {
        id: 'syn-rd-main-ew',
        name: 'Cross-District Avenue (East-West)',
        coordinates: [
          { latitude: lat, longitude: lng - delta * 0.8 },
          { latitude: lat, longitude: lng },
          { latitude: lat, longitude: lng + delta * 0.8 },
        ],
        highwayType: 'secondary',
        lanes: 2,
        maxSpeedKph: 50,
        oneWay: false,
        source: 'seed',
        lengthMeters: Math.round(radiusMeters * 1.6),
      },
      {
        id: 'syn-rd-diagonal',
        name: 'Transit Link Bypass',
        coordinates: [
          { latitude: lat - delta * 0.5, longitude: lng - delta * 0.5 },
          { latitude: lat, longitude: lng },
          { latitude: lat + delta * 0.5, longitude: lng + delta * 0.5 },
        ],
        highwayType: 'tertiary',
        lanes: 2,
        maxSpeedKph: 45,
        oneWay: false,
        source: 'seed',
        lengthMeters: Math.round(radiusMeters * 1.4),
      },
    ];

    const intersections: MobilityIntersection[] = [
      {
        id: 'syn-inter-hub',
        name: 'Zone Central Convergence Hub',
        latitude: lat,
        longitude: lng,
        connectedRoadIds: ['syn-rd-main-ns', 'syn-rd-main-ew', 'syn-rd-diagonal'],
        source: 'seed',
        trafficSignal: true,
        type: 'roundabout',
      },
      {
        id: 'syn-inter-north',
        name: 'North Approach Terminal',
        latitude: lat + delta * 0.8,
        longitude: lng,
        connectedRoadIds: ['syn-rd-main-ns'],
        source: 'seed',
        trafficSignal: true,
        type: 'junction',
      },
      {
        id: 'syn-inter-east',
        name: 'East Sector Crossing',
        latitude: lat,
        longitude: lng + delta * 0.8,
        connectedRoadIds: ['syn-rd-main-ew'],
        source: 'seed',
        trafficSignal: true,
        type: 'junction',
      },
    ];

    return {
      roads,
      intersections,
      pois: [
        {
          name: 'Central Institutional Sector',
          type: 'commercial_zone',
          coordinate: center,
        },
      ],
      source: 'seed',
      provenance: {
        source: 'simulation',
        confidence: 0.78,
        freshness: 'synthetic_topological_generator',
        notes: 'Synthetic topological grid generated around center coordinate (fallback mode; no live OSM feed returned).',
      },
    };
  }
}

export const osmGeoProvider = new OSMGeoProvider();
