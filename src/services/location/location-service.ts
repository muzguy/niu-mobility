import {
  Coordinate,
  MobilityZone,
  LocationSearchResult,
  ZoneTrafficTelemetry,
} from '@/types/geospatial';
import { getRepository } from '@/lib/repositories';
import { osmGeoProvider } from '../geospatial/osm-service';
import { computeBoundingBox, slugify, cleanLocationName } from '../geospatial/geo-utils';
import { generateZoneTrafficDemand } from '@/lib/simulation/demand-generator';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { SEEDED_MOBILITY_ZONES } from '@/data/mobility-zones-seed';

export class LocationService {
  private repo = getRepository();

  /**
   * Search for locations matching a user query using OpenStreetMap geocoding
   */
  public async searchLocations(
    query: string,
    limit = 5
  ): Promise<LocationSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return osmGeoProvider.geocode(query, limit);
  }

  /**
   * Resolves a location from a string query or coordinate pair
   */
  public async resolveLocation(
    queryOrCoords: string | Coordinate
  ): Promise<LocationSearchResult | null> {
    if (typeof queryOrCoords === 'string') {
      const results = await this.searchLocations(queryOrCoords, 1);
      return results[0] || null;
    }

    const { latitude, longitude } = queryOrCoords;
    const bb = computeBoundingBox(queryOrCoords, 1000);
    return {
      id: `coord-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
      name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      displayName: `Geographic Point: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
      latitude,
      longitude,
      type: 'coordinate',
      importance: 0.7,
      source: 'seed',
      boundingBox: bb,
    };
  }

  /**
   * Creates or registers a new Mobility Zone around a geographic point
   */
  public async createMobilityZone(
    name: string,
    center: Coordinate,
    radiusMeters = 1200
  ): Promise<MobilityZone> {
    const zoneId = slugify(name);

    // Check if zone already exists in repository
    const existing = await this.repo.getMobilityZone(zoneId);
    if (existing) {
      return existing;
    }

    // Retrieve road network from OpenStreetMap provider (bounded query)
    const network = await osmGeoProvider.getRoadNetwork(center, radiusMeters);
    const boundingBox = computeBoundingBox(center, radiusMeters);

    const zone: MobilityZone = {
      id: zoneId,
      name: cleanLocationName(name),
      displayName: `${name} Mobility Zone`,
      center,
      radiusMeters,
      boundingBox,
      roads: network.roads,
      intersections: network.intersections,
      source: network.source === 'osm' ? 'osm' : 'seed',
      dataAvailability: {
        roadNetwork: network.source === 'osm' ? 'real' : 'fallback',
        traffic: 'simulated',
        liveSensors: 'unavailable',
      },
      provenance: network.provenance,
      poiCount: network.pois.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save zone and network to repository
    await this.repo.saveMobilityZone(zone);
    await this.repo.saveRoadNetwork(zoneId, {
      roads: network.roads,
      intersections: network.intersections,
    });

    return zone;
  }

  /**
   * Retrieves a Mobility Zone by ID
   */
  public async getMobilityZone(id: string): Promise<MobilityZone | null> {
    const zone = await this.repo.getMobilityZone(id);
    if (zone) return zone;

    // Check pre-seeded fallback zones
    const seed = SEEDED_MOBILITY_ZONES.find((z) => z.id === id);
    if (seed) {
      await this.repo.saveMobilityZone(seed);
      return seed;
    }

    return null;
  }

  /**
   * Lists all registered Mobility Zones
   */
  public async listMobilityZones(): Promise<MobilityZone[]> {
    return this.repo.listMobilityZones();
  }

  /**
   * Retrieves the road network and intersections for a Mobility Zone
   */
  public async getZoneRoadNetwork(zoneId: string) {
    const cached = await this.repo.getRoadNetwork(zoneId);
    if (cached) return cached;

    const zone = await this.getMobilityZone(zoneId);
    if (zone) {
      return {
        roads: zone.roads,
        intersections: zone.intersections,
      };
    }
    return null;
  }

  /**
   * Returns location-aware traffic telemetry and simulation metrics for a Mobility Zone
   */
  public async getZoneTrafficState(
    zoneId: string,
    options: { hour?: number; scenario?: SimulationTrafficMode } = {}
  ): Promise<ZoneTrafficTelemetry | null> {
    const zone = await this.getMobilityZone(zoneId);
    if (!zone) return null;

    const sim = generateZoneTrafficDemand(zone, {
      hourOfDay: options.hour,
      scenarioMode: options.scenario,
    });

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      center: zone.center,
      radiusMeters: zone.radiusMeters,
      dataAvailability: zone.dataAvailability,
      provenance: sim.provenance,
      intersections: sim.intersections,
      metrics: sim.metrics,
      activeCorridor: sim.activeCorridor,
      totalVehiclesApproaching: sim.totalVehiclesApproaching,
      averageQueueMeters: sim.averageQueueMeters,
      averageWaitMinutes: sim.averageWaitMinutes,
      timestamp: new Date().toISOString(),
    };
  }
}

export const locationService = new LocationService();
