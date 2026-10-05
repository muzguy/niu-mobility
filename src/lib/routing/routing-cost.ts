import { RoadGraphEdge, RoadGraphNode, RoutingObjective } from '@/types/routing';

export interface RoutingWeights {
  time: number;
  distance: number;
  congestion: number;
  emissions: number;
  intersectionDelay: number;
}

/**
 * Centralized configurable weights for each routing objective.
 * All values are deterministic coefficients balancing generalized commuter travel cost.
 */
export const OBJECTIVE_WEIGHTS: Record<RoutingObjective, RoutingWeights> = {
  NIU_OPTIMAL: {
    time: 1.0,
    distance: 0.05,
    congestion: 0.40,
    emissions: 0.25,
    intersectionDelay: 0.50,
  },
  FASTEST: {
    time: 1.0,
    distance: 0.0,
    congestion: 0.15,
    emissions: 0.0,
    intersectionDelay: 0.60,
  },
  SHORTEST: {
    time: 0.0,
    distance: 1.0,
    congestion: 0.0,
    emissions: 0.0,
    intersectionDelay: 0.0,
  },
  LOWEST_EMISSIONS: {
    time: 0.20,
    distance: 0.30,
    congestion: 0.25,
    emissions: 1.20,
    intersectionDelay: 0.30,
  },
  LOWEST_CONGESTION: {
    time: 0.30,
    distance: 0.0,
    congestion: 1.50,
    emissions: 0.10,
    intersectionDelay: 0.40,
  },
};

/**
 * Deterministically computes the dynamic cost of traversing a graph edge
 * towards a destination node based on current simulated traffic metrics.
 *
 * Formula:
 * edgeCost = weights.time * travelTimeSeconds
 *          + weights.intersectionDelay * intersectionDelaySeconds
 *          + weights.congestion * congestionPenaltySeconds
 *          + weights.emissions * emissionPenaltySeconds
 *          + weights.distance * distanceCost
 */
export function calculateEdgeCost(
  edge: RoadGraphEdge,
  toNode: RoadGraphNode,
  objective: RoutingObjective,
  penaltyMultiplier = 1.0
): number {
  const weights = OBJECTIVE_WEIGHTS[objective] || OBJECTIVE_WEIGHTS.NIU_OPTIMAL;

  // Pure shortest distance optimization
  if (objective === 'SHORTEST') {
    return edge.lengthMeters * penaltyMultiplier;
  }

  // Base travel time in seconds: length / speed (m/s)
  const speedMps = Math.max(2.78, (edge.currentSpeedKph * 1000) / 3600); // minimum 10 km/h floor
  const travelTimeSeconds = edge.lengthMeters / speedMps;

  // Intersection delay at target junction
  const intersectionDelaySeconds = toNode.isSignalized ? toNode.intersectionDelaySeconds : 2.0;

  // Congestion penalty (triggered when volume-to-capacity exceeds 0.50)
  const congestionPenaltySeconds =
    travelTimeSeconds * Math.max(0, edge.vcRatio - 0.5) * 1.5;

  // Emissions penalty (calibrated: 1 kg CO2 ~ 120 seconds of social/commuter cost)
  const emissionPenaltySeconds = (edge.estimatedEmissionsKg || 0.02) * 120;

  // Normalized distance cost
  const distanceCost = edge.lengthMeters * 0.01;

  const totalCost =
    weights.time * travelTimeSeconds +
    weights.intersectionDelay * intersectionDelaySeconds +
    weights.congestion * congestionPenaltySeconds +
    weights.emissions * emissionPenaltySeconds +
    weights.distance * distanceCost;

  return Math.max(0.1, totalCost * penaltyMultiplier);
}
