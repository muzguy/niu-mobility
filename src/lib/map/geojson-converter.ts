import { GeoRoadSegment, MobilityIntersection } from '@/types/geospatial';
import { Intersection } from '@/types/traffic';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { classifyRoadTraffic, getTrafficStateColor } from './traffic-classifier';

/**
 * Converts GeoRoadSegments into a GeoJSON FeatureCollection of LineStrings
 * with embedded deterministic traffic telemetry.
 */
export function roadsToGeoJSON(
  roads: GeoRoadSegment[],
  scenario: SimulationTrafficMode = 'normal',
  hourOfDay?: number
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  if (!Array.isArray(roads)) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  for (const road of roads) {
    // Malformed geometry guard: ensure array with at least 2 valid points
    if (!Array.isArray(road.coordinates) || road.coordinates.length < 2) {
      continue;
    }

    const validCoordinates: [number, number][] = [];
    for (const c of road.coordinates) {
      if (
        c &&
        typeof c.latitude === 'number' &&
        typeof c.longitude === 'number' &&
        !isNaN(c.latitude) &&
        !isNaN(c.longitude) &&
        c.latitude >= -90 &&
        c.latitude <= 90 &&
        c.longitude >= -180 &&
        c.longitude <= 180
      ) {
        // GeoJSON uses [longitude, latitude]
        validCoordinates.push([c.longitude, c.latitude]);
      }
    }

    if (validCoordinates.length < 2) {
      continue;
    }

    const traffic = classifyRoadTraffic(road, scenario, hourOfDay);

    features.push({
      type: 'Feature',
      id: road.id,
      geometry: {
        type: 'LineString',
        coordinates: validCoordinates,
      },
      properties: {
        id: road.id,
        name: traffic.name,
        highwayType: traffic.highwayType,
        lanes: traffic.lanes,
        trafficState: traffic.trafficState,
        speedKph: traffic.speedKph,
        freeFlowSpeedKph: traffic.freeFlowSpeedKph,
        volumeVph: traffic.volumeVph,
        capacityVph: traffic.capacityVph,
        occupancyPercent: traffic.occupancyPercent,
        queueLengthMeters: traffic.queueLengthMeters,
        color: getTrafficStateColor(traffic.trafficState),
        isEmergencyCorridor: traffic.isEmergencyCorridor,
        source: 'NIU Synthetic Demand Model (Deterministic)',
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Converts MobilityIntersections and active Intersection telemetry
 * into a GeoJSON FeatureCollection of Points.
 */
export function intersectionsToGeoJSON(
  intersections: MobilityIntersection[],
  liveTelemetry?: Intersection[]
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  if (!Array.isArray(intersections)) {
    return { type: 'FeatureCollection', features: [] };
  }

  const telemetryMap = new Map<string, Intersection>();
  if (Array.isArray(liveTelemetry)) {
    liveTelemetry.forEach((item) => telemetryMap.set(item.id, item));
  }

  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

  for (const inter of intersections) {
    if (
      typeof inter.latitude !== 'number' ||
      typeof inter.longitude !== 'number' ||
      isNaN(inter.latitude) ||
      isNaN(inter.longitude)
    ) {
      continue;
    }

    const live = telemetryMap.get(inter.id);
    const vehicleCount = live?.vehicleCount || 45;
    const avgSpeed = live?.averageSpeedKmH || 32;
    const queueMeters = live?.queueLengthMeters || 24;
    const waitTime = live?.waitingTimeMinutes || 1.8;
    const congestion = live?.congestionLevel || 'low';
    const isEVP = live?.isEmergencyPrioritized || false;

    let color = '#10b981'; // green
    if (congestion === 'moderate') color = '#f59e0b'; // amber
    if (congestion === 'severe') color = '#ef4444'; // red
    if (isEVP) color = '#06b6d4'; // cyan

    features.push({
      type: 'Feature',
      id: inter.id,
      geometry: {
        type: 'Point',
        coordinates: [inter.longitude, inter.latitude],
      },
      properties: {
        id: inter.id,
        name: inter.name || `Junction ${inter.id}`,
        shortName: inter.name ? inter.name.split(' ')[0] : inter.id,
        vehicleCount,
        averageSpeedKmH: avgSpeed,
        queueLengthMeters: queueMeters,
        waitingTimeMinutes: waitTime,
        congestionLevel: congestion,
        signalTiming: live?.signalTiming || { north: 32, south: 32, east: 22, west: 22 },
        color,
        isEmergencyPrioritized: isEVP,
        hasSignal: inter.trafficSignal ?? true,
        type: inter.type || 'junction',
        status: live?.lastOptimizedAt ? 'WEBSTER OPTIMIZED' : 'MONITORED NODE',
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Builds an emergency corridor FeatureCollection connecting the primary intersections
 */
export function buildEmergencyCorridorGeoJSON(
  intersections: MobilityIntersection[] = [],
  roads: GeoRoadSegment[] = []
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  const safeIntersections = Array.isArray(intersections) ? intersections : [];
  const safeRoads = Array.isArray(roads) ? roads : [];

  // If there are specific roads tagged or at least 2 intersections, construct a continuous corridor
  if (safeIntersections.length >= 2) {
    const coords: [number, number][] = safeIntersections.slice(0, 4).map((i) => [i.longitude, i.latitude]);
    features.push({
      type: 'Feature',
      id: 'emergency-priority-corridor',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {
        title: 'Priority Green-Wave Corridor',
        route: 'Alpha 1 ➔ Pari Chowk ➔ Knowledge Park Medical Hub',
        status: 'ACTIVE EVP PRE-EMPTION',
        timeSavedSeconds: 221,
      },
    });
  } else if (safeRoads.length > 0 && safeRoads[0].coordinates && safeRoads[0].coordinates.length >= 2) {
    features.push({
      type: 'Feature',
      id: 'emergency-priority-corridor',
      geometry: {
        type: 'LineString',
        coordinates: roads[0].coordinates.map((c) => [c.longitude, c.latitude]),
      },
      properties: {
        title: 'Priority Green-Wave Corridor',
        route: `${roads[0].name || 'Arterial Link'} Corridor`,
        status: 'ACTIVE EVP PRE-EMPTION',
        timeSavedSeconds: 180,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Generates deterministic simulated vehicles along the road network
 */
export function generateSimulatedVehicles(
  roads: GeoRoadSegment[],
  tickOffset: number = 0,
  maxVehicles: number = 18
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  if (!Array.isArray(roads) || roads.length === 0) {
    return { type: 'FeatureCollection', features };
  }

  const validRoads = roads.filter((r) => r.coordinates && r.coordinates.length >= 2);
  if (validRoads.length === 0) return { type: 'FeatureCollection', features };

  let count = 0;
  for (let rIdx = 0; rIdx < validRoads.length && count < maxVehicles; rIdx++) {
    const road = validRoads[rIdx];
    const coords = road.coordinates;
    const numVehiclesOnRoad = Math.min(2, Math.floor(maxVehicles / validRoads.length) || 1);

    for (let vIdx = 0; vIdx < numVehiclesOnRoad && count < maxVehicles; vIdx++) {
      // Deterministic progress along polyline based on road index and time tick
      const baseProgress = (vIdx * 0.5 + (rIdx * 0.17)) % 1.0;
      const progress = (baseProgress + (tickOffset * 0.04) / Math.max(1, road.coordinates.length)) % 1.0;

      // Interpolate coordinate along segments
      const segmentFraction = progress * (coords.length - 1);
      const segIndex = Math.min(coords.length - 2, Math.floor(segmentFraction));
      const segT = segmentFraction - segIndex;

      const p1 = coords[segIndex];
      const p2 = coords[segIndex + 1];

      const lng = p1.longitude + (p2.longitude - p1.longitude) * segT;
      const lat = p1.latitude + (p2.latitude - p1.latitude) * segT;

      // Bearing
      const dLng = p2.longitude - p1.longitude;
      const dLat = p2.latitude - p1.latitude;
      const heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

      const isEV = (rIdx + vIdx) % 3 === 0;
      const isAmbulance = count === 0 && rIdx === 0;

      features.push({
        type: 'Feature',
        id: `veh-${road.id}-${vIdx}`,
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          id: `veh-${count + 1}`,
          type: isAmbulance ? 'ambulance' : isEV ? 'ev' : 'standard',
          color: isAmbulance ? '#f43f5e' : isEV ? '#10b981' : '#38bdf8',
          heading,
          speedKph: Math.round(road.maxSpeedKph ? road.maxSpeedKph * 0.8 : 35),
          roadId: road.id,
          roadName: road.name,
          label: isAmbulance ? 'AMB-108' : isEV ? 'EV Pool' : 'Vehicle',
        },
      });

      count++;
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
