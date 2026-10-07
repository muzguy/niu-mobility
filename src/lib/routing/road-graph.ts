import { Coordinate, MobilityZone } from '@/types/geospatial';
import { RoadGraph, RoadGraphEdge, RoadGraphNode } from '@/types/routing';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { haversineDistanceMeters, estimateRoadLengthMeters } from '@/services/geospatial/geo-utils';
import { calculateEmissions } from '../emissions/emissions-engine';

const BASE_CAPACITY_PER_LANE: Record<string, number> = {
  motorway: 2000,
  trunk: 1750,
  primary: 1400,
  secondary: 1050,
  tertiary: 750,
  residential: 450,
  service: 300,
};

const FREE_FLOW_SPEED_KMH: Record<string, number> = {
  motorway: 80,
  trunk: 65,
  primary: 50,
  secondary: 42,
  tertiary: 35,
  residential: 28,
  service: 20,
};

// In-memory cache for constructed RoadGraphs
const graphCache = new Map<string, RoadGraph>();

/**
 * Builds or retrieves a cached RoadGraph for a MobilityZone and traffic scenario.
 * Strictly deterministic: no Math.random() used.
 */
export function buildRoadGraph(
  zone: MobilityZone,
  scenario: SimulationTrafficMode = 'normal',
  incident?: import('@/types/incident').SimulatedIncident | null
): RoadGraph {
  const incidentKey = incident ? `${incident.id}:${incident.severity}` : 'none';
  const cacheKey = `${zone.id}:${scenario}:${incidentKey}:${zone.roads.length}:${zone.intersections.length}`;
  const cached = graphCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const nodes = new Map<string, RoadGraphNode>();
  const edges = new Map<string, RoadGraphEdge>();
  const adjacency = new Map<string, string[]>();

  // Helper to ensure node adjacency entry exists
  const ensureAdjacency = (nodeId: string) => {
    if (!adjacency.has(nodeId)) {
      adjacency.set(nodeId, []);
    }
  };

  // Helper to find nearest intersection node within snap tolerance (meters)
  const findIntersectionNear = (coord: Coordinate, toleranceMeters = 60): RoadGraphNode | null => {
    let nearest: RoadGraphNode | null = null;
    let minDist = toleranceMeters;

    for (const node of nodes.values()) {
      const d = haversineDistanceMeters(coord, node.coordinate);
      if (d < minDist) {
        minDist = d;
        nearest = node;
      }
    }
    return nearest;
  };

  // 1. Register explicit zone intersections as primary graph nodes
  zone.intersections.forEach((inter, idx) => {
    if (typeof inter.latitude !== 'number' || typeof inter.longitude !== 'number' || isNaN(inter.latitude)) {
      return;
    }

    let delaySeconds = 2.0;
    if (inter.trafficSignal) {
      switch (scenario) {
        case 'rush_hour':
          delaySeconds = 38.0;
          break;
        case 'optimized':
          delaySeconds = 14.0;
          break;
        case 'emergency':
          delaySeconds = 18.0;
          break;
        default:
          delaySeconds = 24.0;
      }
    }

    const node: RoadGraphNode = {
      id: inter.id,
      name: inter.name || `Intersection ${idx + 1}`,
      coordinate: { latitude: inter.latitude, longitude: inter.longitude },
      connectedEdgeIds: [],
      isSignalized: Boolean(inter.trafficSignal),
      intersectionDelaySeconds: delaySeconds,
    };

    nodes.set(node.id, node);
    ensureAdjacency(node.id);
  });

  // Scenario volume multiplier
  let scenarioMultiplier = 1.0;
  if (scenario === 'rush_hour') scenarioMultiplier = 1.55;
  if (scenario === 'emergency') scenarioMultiplier = 1.25;
  if (scenario === 'optimized') scenarioMultiplier = 0.82;

  // 2. Process each road segment into directed graph edges
  zone.roads.forEach((road, roadIdx) => {
    if (!road.coordinates || road.coordinates.length < 2) {
      return; // Skip invalid geometry
    }

    // Filter valid coordinate points
    const validCoords = road.coordinates.filter(
      (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number' && !isNaN(c.latitude) && !isNaN(c.longitude)
    );
    if (validCoords.length < 2) return;

    const startCoord = validCoords[0];
    const endCoord = validCoords[validCoords.length - 1];

    // Find or create origin node
    let fromNode = findIntersectionNear(startCoord);
    if (!fromNode) {
      const nodeId = `node-start-${road.id}`;
      fromNode = {
        id: nodeId,
        name: `${road.name || 'Road'} Start Terminal`,
        coordinate: startCoord,
        connectedEdgeIds: [],
        isSignalized: false,
        intersectionDelaySeconds: 2.0,
      };
      nodes.set(fromNode.id, fromNode);
      ensureAdjacency(fromNode.id);
    }

    // Find or create destination node
    let toNode = findIntersectionNear(endCoord);
    if (!toNode || toNode.id === fromNode.id) {
      const nodeId = `node-end-${road.id}`;
      toNode = {
        id: nodeId,
        name: `${road.name || 'Road'} End Terminal`,
        coordinate: endCoord,
        connectedEdgeIds: [],
        isSignalized: false,
        intersectionDelaySeconds: 2.0,
      };
      nodes.set(toNode.id, toNode);
      ensureAdjacency(toNode.id);
    }

    const lengthMeters = road.lengthMeters && road.lengthMeters > 0
      ? road.lengthMeters
      : Math.round(estimateRoadLengthMeters(validCoords));

    const highwayType = road.highwayType || 'primary';
    const lanes = road.lanes || 2;
    const baseCapacity = (BASE_CAPACITY_PER_LANE[highwayType] || 1200) * lanes;
    const freeFlowSpeed = road.maxSpeedKph || FREE_FLOW_SPEED_KMH[highwayType] || 45;
    const targetIncident = incident ? zone.intersections.find((i) => i.id === incident.intersectionId) : null;
    const isIncidentConnected = Boolean(
      targetIncident && targetIncident.connectedRoadIds.includes(road.id)
    );
    let effectiveCapacity = baseCapacity;
    let effectiveFreeFlow = freeFlowSpeed;
    if (isIncidentConnected && incident) {
      const capDrop = incident.severity === 'major' ? 0.28 : incident.severity === 'moderate' ? 0.50 : 0.70;
      const speedDrop = incident.severity === 'major' ? 0.45 : incident.severity === 'moderate' ? 0.65 : 0.82;
      effectiveCapacity *= capDrop;
      effectiveFreeFlow *= speedDrop;
    }

    // Deterministic seed variance based on road index and character codes
    const seedOffset = ((roadIdx * 19 + road.id.length * 7) % 25) / 100; // 0.00 - 0.24
    const seedVariance = 0.88 + seedOffset;

    // Volume to capacity calculation (BPR curve)
    const effectiveDemand = baseCapacity * 0.45 * scenarioMultiplier * seedVariance;
    const vcRatio = Math.min(1.5, effectiveDemand / Math.max(1, effectiveCapacity));

    // Speed calculation from BPR model: S = S0 / (1 + 0.25 * (V/C)^3.5)
    const currentSpeedKph = Math.max(
      8,
      Math.round(effectiveFreeFlow / (1 + 0.25 * Math.pow(vcRatio, 3.5)))
    );

    let trafficState: 'low' | 'moderate' | 'severe' = 'low';
    if (vcRatio >= 0.82) trafficState = 'severe';
    else if (vcRatio >= 0.52) trafficState = 'moderate';

    // Emissions calculation via calibrated engine
    const emissions = calculateEmissions({
      distanceKm: lengthMeters / 1000,
      vehicleType: 'compact_car',
      fuelType: 'petrol',
      occupancy: 1,
    });

    const isOneWay = Boolean(road.oneWay);

    // Forward Edge
    const forwardEdgeId = `edge-${road.id}-fwd`;
    const forwardEdge: RoadGraphEdge = {
      id: forwardEdgeId,
      roadId: road.id,
      name: road.name || `Road ${road.id}`,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      coordinates: validCoords,
      lengthMeters,
      highwayType,
      lanes,
      maxSpeedKph: freeFlowSpeed,
      freeFlowSpeedKph: freeFlowSpeed,
      currentSpeedKph,
      volumeVehPerHour: Math.round(effectiveDemand),
      capacityVehPerHour: baseCapacity,
      vcRatio: Number(vcRatio.toFixed(3)),
      trafficState,
      oneWay: isOneWay,
      estimatedDelaySeconds: Math.round(lengthMeters / Math.max(1, (currentSpeedKph * 1000) / 3600)),
      estimatedEmissionsKg: emissions.totalCo2Kg,
    };

    edges.set(forwardEdge.id, forwardEdge);
    fromNode.connectedEdgeIds.push(forwardEdge.id);
    adjacency.get(fromNode.id)?.push(forwardEdge.id);

    // Reverse Edge (only if not one-way)
    if (!isOneWay) {
      const reverseEdgeId = `edge-${road.id}-rev`;
      const reverseEdge: RoadGraphEdge = {
        id: reverseEdgeId,
        roadId: road.id,
        name: road.name || `Road ${road.id} (Reverse)`,
        fromNodeId: toNode.id,
        toNodeId: fromNode.id,
        coordinates: [...validCoords].reverse(),
        lengthMeters,
        highwayType,
        lanes,
        maxSpeedKph: freeFlowSpeed,
        freeFlowSpeedKph: freeFlowSpeed,
        currentSpeedKph,
        volumeVehPerHour: Math.round(effectiveDemand),
        capacityVehPerHour: baseCapacity,
        vcRatio: Number(vcRatio.toFixed(3)),
        trafficState,
        oneWay: false,
        estimatedDelaySeconds: Math.round(lengthMeters / Math.max(1, (currentSpeedKph * 1000) / 3600)),
        estimatedEmissionsKg: emissions.totalCo2Kg,
      };

      edges.set(reverseEdge.id, reverseEdge);
      toNode.connectedEdgeIds.push(reverseEdge.id);
      adjacency.get(toNode.id)?.push(reverseEdge.id);
    }
  });

  const graph: RoadGraph = {
    zoneId: zone.id,
    nodes,
    edges,
    adjacency,
    builtAt: new Date().toISOString(),
    scenario,
  };

  graphCache.set(cacheKey, graph);
  return graph;
}

/**
 * Clears the graph cache (useful for testing and network updates)
 */
export function clearRoadGraphCache(): void {
  graphCache.clear();
}
