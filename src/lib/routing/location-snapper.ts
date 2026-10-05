import { Coordinate } from '@/types/geospatial';
import { LocationSnapResult, RoadGraph } from '@/types/routing';
import { haversineDistanceMeters } from '@/services/geospatial/geo-utils';

export const MAX_SNAP_DISTANCE_METERS = 5000;

export class SnappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnappingError';
  }
}

/**
 * Deterministically snaps an arbitrary coordinate to the nearest road network node/edge in a RoadGraph.
 * Throws a SnappingError if coordinate lies outside the zone boundary threshold (> 5000m).
 */
export function snapCoordinateToGraph(
  coord: Coordinate,
  graph: RoadGraph,
  label = 'Location'
): LocationSnapResult {
  if (
    typeof coord.latitude !== 'number' ||
    typeof coord.longitude !== 'number' ||
    isNaN(coord.latitude) ||
    isNaN(coord.longitude)
  ) {
    throw new SnappingError(`Invalid coordinates supplied for ${label}.`);
  }

  if (graph.nodes.size === 0) {
    throw new SnappingError(`Road network graph has 0 nodes. Cannot snap ${label}.`);
  }

  let nearestNodeId = '';
  let nearestNodeName = '';
  let minDistanceMeters = Infinity;
  let snappedCoord: Coordinate = { latitude: coord.latitude, longitude: coord.longitude };
  let matchedRoadId: string | undefined;

  // 1. Check all nodes
  for (const [nodeId, node] of graph.nodes.entries()) {
    const dist = haversineDistanceMeters(coord, node.coordinate);
    if (dist < minDistanceMeters) {
      minDistanceMeters = dist;
      nearestNodeId = nodeId;
      nearestNodeName = node.name;
      snappedCoord = node.coordinate;
    }
  }

  // 2. Check all edges for any intermediate coordinates closer than junction nodes
  for (const edge of graph.edges.values()) {
    for (const c of edge.coordinates) {
      const dist = haversineDistanceMeters(coord, c);
      if (dist < minDistanceMeters) {
        minDistanceMeters = dist;
        snappedCoord = c;
        matchedRoadId = edge.roadId;
        // Nearest graph routing node is still the from/to node of this edge
        nearestNodeId = edge.fromNodeId;
        nearestNodeName = graph.nodes.get(edge.fromNodeId)?.name || edge.name;
      }
    }
  }

  // Enforce boundary threshold check
  if (minDistanceMeters > MAX_SNAP_DISTANCE_METERS) {
    throw new SnappingError(
      `${label} is outside the active Mobility Zone (${Math.round(minDistanceMeters)}m from nearest road).`
    );
  }

  return {
    requestedCoordinate: coord,
    snappedCoordinate: snappedCoord,
    nearestNodeId,
    snappedNodeName: nearestNodeName,
    roadId: matchedRoadId,
    distanceMeters: Math.round(minDistanceMeters),
  };
}
