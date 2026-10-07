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
  hourOfDay?: number,
  minutesAhead: number = 0
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

    const traffic = classifyRoadTraffic(road, scenario, hourOfDay, minutesAhead);


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
 * Generates deterministic simulated vehicles along the road network.
 * Vehicles visually respond to the active simulation scenario:
 *  - NORMAL: steady cruising velocity, EV pools & standard commuters
 *  - RUSH_HOUR: slower progress (BPR speed reduction), higher queuing/bunching, congested red/yellow states
 *  - EMERGENCY: civilian vehicles yield/slow down, single dedicated AMB-108 ambulance races along priority corridor
 *  - OPTIMIZED: Webster adaptive signal splits enable synchronized green wave flow, higher cruising speed
 */
export function generateSimulatedVehicles(
  roads: GeoRoadSegment[],
  tickOffset: number = 0,
  maxVehicles: number = 18,
  scenario: SimulationTrafficMode = 'normal',
  emergencyCorridor?: import('@/types/traffic').EmergencyCorridor | null
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  if (!Array.isArray(roads) || roads.length === 0) {
    return { type: 'FeatureCollection', features };
  }

  const validRoads = roads.filter((r) => r.coordinates && r.coordinates.length >= 2);
  if (validRoads.length === 0) return { type: 'FeatureCollection', features };

  // Scenario-specific kinematics & colors
  let speedRate = 0.04;
  let baseSpeedKph = 38;
  if (scenario === 'rush_hour') {
    speedRate = 0.018; // Congested slow crawl
    baseSpeedKph = 18;
  } else if (scenario === 'emergency') {
    speedRate = 0.015; // Civilian vehicles yield
    baseSpeedKph = 20;
  } else if (scenario === 'optimized') {
    speedRate = 0.055; // Webster synchronized progression
    baseSpeedKph = 48;
  }

  let count = 0;
  for (let rIdx = 0; rIdx < validRoads.length && count < maxVehicles; rIdx++) {
    const road = validRoads[rIdx];
    const coords = road.coordinates;
    const numVehiclesOnRoad = Math.min(2, Math.floor(maxVehicles / validRoads.length) || 1);

    for (let vIdx = 0; vIdx < numVehiclesOnRoad && count < maxVehicles; vIdx++) {
      // Deterministic progress along polyline based on road index and time tick
      const baseProgress = (vIdx * 0.5 + (rIdx * 0.17)) % 1.0;
      const progress = (baseProgress + (tickOffset * speedRate) / Math.max(1, road.coordinates.length)) % 1.0;

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

      // Visual styling mapped to scenario
      let color = isEV ? '#10b981' : '#38bdf8';
      let status = isEV ? 'EV Pool Shared' : 'Standard Commuter';
      let speedKph = Math.round((road.maxSpeedKph ? road.maxSpeedKph * 0.8 : baseSpeedKph) * (isEV ? 1.05 : 0.95));

      if (scenario === 'rush_hour') {
        const isCongested = (rIdx + vIdx) % 2 === 0;
        color = isCongested ? '#ef4444' : '#f59e0b'; // Red / Yellow
        status = isCongested ? 'Congested / Queueing' : 'Moderate Bottleneck';
        speedKph = Math.round(baseSpeedKph * (0.8 + (rIdx % 3) * 0.15));
      } else if (scenario === 'emergency') {
        color = '#94a3b8'; // Yielding civilian vehicle
        status = 'Yielding to EVP';
        speedKph = 18;
      } else if (scenario === 'optimized') {
        color = '#10b981'; // Green: synchronized flow
        status = 'Webster Green-Wave';
        speedKph = Math.round(baseSpeedKph * 1.1);
      }

      features.push({
        type: 'Feature',
        id: `veh-${road.id}-${vIdx}`,
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          id: `veh-${count + 1}`,
          type: isEV ? 'ev' : 'standard',
          color,
          heading,
          speedKph,
          roadId: road.id,
          roadName: road.name,
          label: isEV ? 'EV Pool' : 'Commuter',
          status,
          scenario,
        },
      });

      count++;
    }
  }

  // In EMERGENCY scenario: Add exactly one animated ambulance (AMB-108) along the designated emergency corridor
  if (scenario === 'emergency') {
    // Standard Greater Noida emergency corridor: Alpha 1 -> Pari Chowk -> Knowledge Park Medical Hub
    const corridorCoords: [number, number][] = [
      [77.518, 28.472],   // Alpha 1
      [77.5142, 28.4705], // Jagat / Alpha connector
      [77.5105, 28.4682], // Pari Chowk
      [77.5055, 28.4645], // KP Arterial
      [77.4998, 28.461],  // Knowledge Park Medical Hub
    ];

    const ambProgress = ((tickOffset * 0.08) % 1.0);
    const ambFraction = ambProgress * (corridorCoords.length - 1);
    const ambSegIndex = Math.min(corridorCoords.length - 2, Math.floor(ambFraction));
    const ambSegT = ambFraction - ambSegIndex;

    const ap1 = corridorCoords[ambSegIndex];
    const ap2 = corridorCoords[ambSegIndex + 1];

    const aLng = ap1[0] + (ap2[0] - ap1[0]) * ambSegT;
    const aLat = ap1[1] + (ap2[1] - ap1[1]) * ambSegT;

    const adLng = ap2[0] - ap1[0];
    const adLat = ap2[1] - ap1[1];
    const ambHeading = (Math.atan2(adLng, adLat) * 180) / Math.PI;

    const ambVehicleId = emergencyCorridor?.vehicleId || 'AMB-108';
    const ambRoute = emergencyCorridor
      ? `${emergencyCorridor.origin} ➔ ${emergencyCorridor.destination}`
      : 'Alpha 1 ➔ Pari Chowk ➔ KP Medical Hub (Priority Corridor)';

    features.push({
      type: 'Feature',
      id: 'veh-emergency-ambulance',
      geometry: {
        type: 'Point',
        coordinates: [aLng, aLat],
      },
      properties: {
        id: ambVehicleId,
        type: 'ambulance',
        isAmbulance: true,
        color: '#f43f5e',
        heading: ambHeading,
        speedKph: 72,
        roadId: 'emergency-corridor',
        roadName: ambRoute,
        label: `${ambVehicleId} (EVP PRIORITY)`,
        status: 'ACTIVE GREEN-WAVE PRE-EMPTION',
        timeSaved: emergencyCorridor ? `${Math.round(emergencyCorridor.timeSavedSeconds / 60)}m ${emergencyCorridor.timeSavedSeconds % 60}s saved` : '3m 41s saved',
        scenario: 'emergency',
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Generates an animated pulse point along the selected route LineString coordinates
 */
export function generateRoutePulsePoint(
  routeCoordinates: [number, number][],
  tickOffset: number = 0
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
    return { type: 'FeatureCollection', features };
  }

  const progress = ((tickOffset * 0.035) % 1.0);
  const fraction = progress * (routeCoordinates.length - 1);
  const segIndex = Math.min(routeCoordinates.length - 2, Math.floor(fraction));
  const segT = fraction - segIndex;

  const p1 = routeCoordinates[segIndex];
  const p2 = routeCoordinates[segIndex + 1];

  const lng = p1[0] + (p2[0] - p1[0]) * segT;
  const lat = p1[1] + (p2[1] - p1[1]) * segT;

  const dLng = p2[0] - p1[0];
  const dLat = p2[1] - p1[1];
  const heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

  features.push({
    type: 'Feature',
    id: 'selected-route-pulse',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    properties: {
      id: 'route-pulse',
      heading,
      color: '#34d399',
    },
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Converts SmartRouteAlternatives into a GeoJSON FeatureCollection of LineStrings
 */
export function routesToGeoJSON(
  routes: import('@/types/routing').SmartRouteAlternative[]
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  if (!Array.isArray(routes)) {
    return { type: 'FeatureCollection', features: [] };
  }

  return {
    type: 'FeatureCollection',
    features: routes.map((route) => ({
      type: 'Feature',
      id: route.id,
      geometry: {
        type: 'LineString',
        coordinates: route.geometry.coordinates,
      },
      properties: {
        id: route.id,
        routeId: route.routeId,
        title: route.title,
        badge: route.badge,
        type: route.type,
        distanceKm: route.distanceKm,
        etaMinutes: route.etaMinutes,
        emissionsKg: route.emissionsKg,
        niuScore: route.niuScore,
        isRecommended: route.isRecommended,
        colorHex: route.colorHex,
        congestionScore: route.congestionScore,
        trafficLevel: route.trafficLevel,
        recommendationReason: route.recommendationReason,
      },
    })),
  };
}

/**
 * Creates Origin and Destination waypoint markers GeoJSON FeatureCollection
 */
export function routeEndpointsToGeoJSON(
  origin?: { coordinate: { latitude: number; longitude: number }; name?: string } | null,
  destination?: { coordinate: { latitude: number; longitude: number }; name?: string } | null
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

  if (origin && typeof origin.coordinate?.latitude === 'number') {
    features.push({
      type: 'Feature',
      id: 'point-origin',
      geometry: {
        type: 'Point',
        coordinates: [origin.coordinate.longitude, origin.coordinate.latitude],
      },
      properties: {
        id: 'origin',
        label: 'A: Origin',
        name: origin.name || 'Origin',
        color: '#10b981',
      },
    });
  }

  if (destination && typeof destination.coordinate?.latitude === 'number') {
    features.push({
      type: 'Feature',
      id: 'point-destination',
      geometry: {
        type: 'Point',
        coordinates: [destination.coordinate.longitude, destination.coordinate.latitude],
      },
      properties: {
        id: 'destination',
        label: 'B: Destination',
        name: destination.name || 'Destination',
        color: '#06b6d4',
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
