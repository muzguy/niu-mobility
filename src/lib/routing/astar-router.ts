import { Coordinate } from '@/types/geospatial';
import {
  RoadGraph,
  RoadGraphEdge,
  RoadGraphNode,
  RoutingObjective,
  RouteType,
  SmartRouteAlternative,
} from '@/types/routing';
import { calculateEdgeCost } from './routing-cost';
import { haversineDistanceMeters } from '@/services/geospatial/geo-utils';
import { scoreAndRankRoutes } from './route-scorer';

// Simple Binary Min-Heap for high-performance A* search
class MinHeap<T> {
  private items: Array<{ key: number; value: T }> = [];

  public push(key: number, value: T): void {
    this.items.push({ key, value });
    this.bubbleUp(this.items.length - 1);
  }

  public pop(): { key: number; value: T } | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const bottom = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  public get size(): number {
    return this.items.length;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.items[idx].key >= this.items[parentIdx].key) break;
      const tmp = this.items[idx];
      this.items[idx] = this.items[parentIdx];
      this.items[parentIdx] = tmp;
      idx = parentIdx;
    }
  }

  private bubbleDown(idx: number): void {
    const len = this.items.length;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;

      if (left < len && this.items[left].key < this.items[smallest].key) {
        smallest = left;
      }
      if (right < len && this.items[right].key < this.items[smallest].key) {
        smallest = right;
      }
      if (smallest === idx) break;

      const tmp = this.items[idx];
      this.items[idx] = this.items[smallest];
      this.items[smallest] = tmp;
      idx = smallest;
    }
  }
}

/**
 * Admissible heuristic estimate for A* search towards destination coordinate.
 */
function heuristic(
  coord: Coordinate,
  destCoord: Coordinate,
  objective: RoutingObjective
): number {
  const dist = haversineDistanceMeters(coord, destCoord);
  if (objective === 'SHORTEST') {
    return dist;
  }
  // 100 km/h = 27.78 m/s upper speed bound => strictly admissible cost lower bound
  return dist / 27.78;
}

interface PathResult {
  edges: RoadGraphEdge[];
  nodes: RoadGraphNode[];
  totalCost: number;
}

/**
 * Finds a single shortest/optimal path on the RoadGraph using A*.
 */
export function findPathAStar(
  graph: RoadGraph,
  startNodeId: string,
  destNodeId: string,
  objective: RoutingObjective,
  penaltyMultipliers: Map<string, number> = new Map()
): PathResult | null {
  const destNode = graph.nodes.get(destNodeId);
  const startNode = graph.nodes.get(startNodeId);
  if (!destNode || !startNode) return null;

  if (startNodeId === destNodeId) {
    return { edges: [], nodes: [startNode], totalCost: 0 };
  }

  const openSet = new MinHeap<string>();
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, { prevNodeId: string; edge: RoadGraphEdge }>();

  gScore.set(startNodeId, 0);
  openSet.push(heuristic(startNode.coordinate, destNode.coordinate, objective), startNodeId);

  const visited = new Set<string>();

  while (openSet.size > 0) {
    const current = openSet.pop();
    if (!current) break;
    const currentId = current.value;

    if (currentId === destNodeId) {
      // Reconstruct path
      const pathEdges: RoadGraphEdge[] = [];
      const pathNodes: RoadGraphNode[] = [];
      let curr = destNodeId;

      const finalNode = graph.nodes.get(curr);
      if (finalNode) pathNodes.unshift(finalNode);

      while (cameFrom.has(curr)) {
        const step = cameFrom.get(curr)!;
        pathEdges.unshift(step.edge);
        curr = step.prevNodeId;
        const prevN = graph.nodes.get(curr);
        if (prevN) pathNodes.unshift(prevN);
      }

      return {
        edges: pathEdges,
        nodes: pathNodes,
        totalCost: gScore.get(destNodeId) || 0,
      };
    }

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const outEdgeIds = graph.adjacency.get(currentId) || [];
    const currentCost = gScore.get(currentId) ?? Infinity;

    for (const edgeId of outEdgeIds) {
      const edge = graph.edges.get(edgeId);
      if (!edge) continue;

      const neighborNodeId = edge.toNodeId;
      const neighborNode = graph.nodes.get(neighborNodeId);
      if (!neighborNode) continue;

      const penalty = penaltyMultipliers.get(edge.id) || 1.0;
      const edgeCost = calculateEdgeCost(edge, neighborNode, objective, penalty);
      const tentativeG = currentCost + edgeCost;

      const prevG = gScore.get(neighborNodeId) ?? Infinity;
      if (tentativeG < prevG) {
        cameFrom.set(neighborNodeId, { prevNodeId: currentId, edge });
        gScore.set(neighborNodeId, tentativeG);
        const fScore = tentativeG + heuristic(neighborNode.coordinate, destNode.coordinate, objective);
        openSet.push(fScore, neighborNodeId);
      }
    }
  }

  return null;
}

/**
 * Checks if two path results follow distinct physical corridors
 */
function arePathsDistinct(edges1: RoadGraphEdge[], edges2: RoadGraphEdge[]): boolean {
  if (edges1.length === 0 || edges2.length === 0) return false;
  const ids1 = edges1.map((e) => e.roadId);
  const ids2 = edges2.map((e) => e.roadId);

  // Exact match check
  if (ids1.length === ids2.length && ids1.every((id, idx) => id === ids2[idx])) {
    return false;
  }

  // Count common road links
  const set1 = new Set(ids1);
  let shared = 0;
  for (const id of ids2) {
    if (set1.has(id)) shared++;
  }
  const overlap = shared / Math.max(ids1.length, ids2.length);
  return overlap < 0.85 || ids1.length !== ids2.length;
}

/**
 * Assembles continuous GeoJSON LineString coordinates from path edges without gaps or duplicates.
 */
function assembleContinuousGeometry(edges: RoadGraphEdge[], startCoord: Coordinate): [number, number][] {
  if (edges.length === 0) {
    return [[startCoord.longitude, startCoord.latitude]];
  }

  const result: [number, number][] = [];

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const coords = edge.coordinates;
    if (!coords || coords.length === 0) continue;

    for (let cIdx = 0; cIdx < coords.length; cIdx++) {
      const pt: [number, number] = [coords[cIdx].longitude, coords[cIdx].latitude];

      // Avoid adjacent duplicate points in LineString
      if (
        result.length === 0 ||
        result[result.length - 1][0] !== pt[0] ||
        result[result.length - 1][1] !== pt[1]
      ) {
        result.push(pt);
      }
    }
  }

  return result;
}

/**
 * Computes SmartRouteAlternative from path edges.
 */
function buildRouteAlternative(
  path: PathResult,
  startCoord: Coordinate,
  objective: RoutingObjective,
  type: RouteType,
  title: string,
  badge: string,
  colorHex: string,
  routeIndex: number
): SmartRouteAlternative {
  const lineStringCoords = assembleContinuousGeometry(path.edges, startCoord);

  let totalDistanceMeters = 0;
  let totalTravelTimeSeconds = 0;
  let totalIntersectionDelaySeconds = 0;
  let totalEmissionsKg = 0;
  let weightedVcSum = 0;

  path.edges.forEach((edge) => {
    totalDistanceMeters += edge.lengthMeters;
    const speedMps = Math.max(2.78, (edge.currentSpeedKph * 1000) / 3600);
    totalTravelTimeSeconds += edge.lengthMeters / speedMps;
    totalEmissionsKg += edge.estimatedEmissionsKg;
    weightedVcSum += edge.vcRatio * edge.lengthMeters;
  });

  path.nodes.forEach((node) => {
    if (node.isSignalized) {
      totalIntersectionDelaySeconds += node.intersectionDelaySeconds;
    }
  });

  const totalDurationSeconds = Math.round(totalTravelTimeSeconds + totalIntersectionDelaySeconds);
  const totalDistanceKm = Number((totalDistanceMeters / 1000).toFixed(2));
  const etaMinutes = Math.max(1, Math.round(totalDurationSeconds / 60));
  const idleDelayMinutes = Number((totalIntersectionDelaySeconds / 60).toFixed(1));
  const avgSpeedKmH = totalDurationSeconds > 0
    ? Math.max(8, Math.round((totalDistanceKm / (totalDurationSeconds / 3600))))
    : 30;

  const avgVcRatio = totalDistanceMeters > 0 ? weightedVcSum / totalDistanceMeters : 0.4;
  const congestionScore = Math.min(100, Math.round(avgVcRatio * 85));

  let trafficLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (avgVcRatio >= 0.8) trafficLevel = 'High';
  else if (avgVcRatio >= 0.5) trafficLevel = 'Medium';

  const keyCorridors = Array.from(new Set(path.edges.map((e) => e.name).filter(Boolean))).slice(0, 3);
  if (keyCorridors.length === 0) keyCorridors.push('Sector Transit Connector');

  const fuelConsumedLiters = Number((totalEmissionsKg / 2.31).toFixed(2));

  return {
    id: `route-alt-${routeIndex + 1}-${type}`,
    routeId: `route-alt-${routeIndex + 1}-${type}`,
    type,
    title,
    badge,
    tagline: `Via ${keyCorridors[0] || 'Express Arterial'}`,
    objective,
    geometry: {
      type: 'LineString',
      coordinates: lineStringCoords,
    },
    distanceMeters: totalDistanceMeters,
    distanceKm: totalDistanceKm,
    durationSeconds: totalDurationSeconds,
    durationMinutes: etaMinutes,
    etaMinutes,
    emissionsKg: Number(totalEmissionsKg.toFixed(2)),
    estimatedCo2Kg: Number(totalEmissionsKg.toFixed(2)),
    fuelConsumedLiters,
    congestionScore,
    congestionIndex: congestionScore,
    trafficLevel,
    intersectionDelaySeconds: Math.round(totalIntersectionDelaySeconds),
    idleDelayMinutes,
    averageSpeedKmH: avgSpeedKmH,
    roadCount: path.edges.length,
    keyCorridors,
    pathDescription: `${keyCorridors.join(' ➔ ')} (${path.edges.length} road links, ${idleDelayMinutes}m signal delay)`,
    niuScore: 85,
    isRecommended: false,
    recommendationReason: '',
    colorHex,
    scoreBreakdown: {
      timeScore: 85,
      congestionScore: 85,
      emissionsScore: 85,
      delayScore: 85,
    },
  };
}

/**
 * Computes up to 3 diverse, deterministic route alternatives for given start and end nodes.
 */
export function computeSmartRoutes(
  graph: RoadGraph,
  startNodeId: string,
  destNodeId: string,
  primaryObjective: RoutingObjective = 'NIU_OPTIMAL'
): SmartRouteAlternative[] {
  const startNode = graph.nodes.get(startNodeId);
  const destNode = graph.nodes.get(destNodeId);
  if (!startNode || !destNode) return [];

  const foundPaths: PathResult[] = [];

  // 1. Primary optimal path
  const path1 = findPathAStar(graph, startNodeId, destNodeId, primaryObjective);
  if (!path1 || path1.edges.length === 0) {
    return [];
  }
  foundPaths.push(path1);

  // 2. Try secondary corridor (via LOWEST_CONGESTION or 2.2x penalty)
  const penalties2 = new Map<string, number>();
  path1.edges.forEach((e) => penalties2.set(e.id, 2.2));

  let path2 = findPathAStar(graph, startNodeId, destNodeId, 'LOWEST_CONGESTION');
  if (!path2 || !arePathsDistinct(path1.edges, path2.edges)) {
    path2 = findPathAStar(graph, startNodeId, destNodeId, primaryObjective, penalties2);
  }

  if (path2 && path2.edges.length > 0 && arePathsDistinct(path1.edges, path2.edges)) {
    foundPaths.push(path2);
  }

  // 3. Try tertiary corridor (via LOWEST_EMISSIONS or 2.8x penalty on combined edges)
  const penalties3 = new Map<string, number>();
  path1.edges.forEach((e) => penalties3.set(e.id, 2.8));
  if (path2) {
    path2.edges.forEach((e) => penalties3.set(e.id, 2.4));
  }

  let path3 = findPathAStar(graph, startNodeId, destNodeId, 'LOWEST_EMISSIONS');
  const isDistinctFromExisting = (p: PathResult) =>
    foundPaths.every((existing) => arePathsDistinct(existing.edges, p.edges));

  if (!path3 || !isDistinctFromExisting(path3)) {
    path3 = findPathAStar(graph, startNodeId, destNodeId, 'SHORTEST', penalties3);
  }
  if (!path3 || !isDistinctFromExisting(path3)) {
    path3 = findPathAStar(graph, startNodeId, destNodeId, primaryObjective, penalties3);
  }

  if (path3 && path3.edges.length > 0 && isDistinctFromExisting(path3)) {
    foundPaths.push(path3);
  }

  // Convert found paths into SmartRouteAlternatives
  const rawAlternatives: SmartRouteAlternative[] = foundPaths.map((path, idx) => {
    if (idx === 0) {
      return buildRouteAlternative(
        path,
        startNode.coordinate,
        primaryObjective,
        primaryObjective === 'FASTEST' ? 'fastest' : 'optimal',
        'NIU OPTIMAL CORRIDOR',
        'Recommended Multi-Criteria Balance',
        '#10b981',
        0
      );
    } else if (idx === 1) {
      return buildRouteAlternative(
        path,
        startNode.coordinate,
        'LOWEST_CONGESTION',
        'balanced',
        'PERIPHERAL BYPASS',
        'Smooth Flow / Lower Congestion',
        '#38bdf8',
        1
      );
    } else {
      return buildRouteAlternative(
        path,
        startNode.coordinate,
        'LOWEST_EMISSIONS',
        'greenest',
        'ECO GREENWAY',
        'Minimum Carbon Footprint',
        '#059669',
        2
      );
    }
  });

  // Score and rank all generated alternatives
  return scoreAndRankRoutes(rawAlternatives);
}
