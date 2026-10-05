import { INITIAL_INTERSECTIONS } from '@/data/intersections';
import { CongestionLevel, Intersection } from '@/types/traffic';
import { CityMobilityMetrics } from '@/types/mobility';

/**
 * Computes the composite Congestion Index (0 - 100) for an intersection
 */
export function calculateCongestionIndex(intersection: Intersection): number {
  const maxExpectedQueue = 100; // meters
  const maxExpectedVolume = 180; // vehicles
  const freeFlowSpeed = 50; // km/h

  const queueFactor = Math.min(1, intersection.queueLengthMeters / maxExpectedQueue);
  const volumeFactor = Math.min(1, intersection.vehicleCount / maxExpectedVolume);
  const speedDeficit = Math.max(0, 1 - intersection.averageSpeedKmH / freeFlowSpeed);

  const index = 0.40 * queueFactor + 0.35 * volumeFactor + 0.25 * speedDeficit;
  return Math.round(index * 100);
}

/**
 * Derives the semantic CongestionLevel from numerical congestion index
 */
export function deriveCongestionLevel(score: number): CongestionLevel {
  if (score >= 65) return 'severe';
  if (score >= 35) return 'moderate';
  return 'low';
}

/**
 * Aggregates citywide mobility telemetry across all simulated intersection nodes
 */
export function aggregateCityMetrics(intersections: Intersection[]): CityMobilityMetrics {
  const nodes = intersections.length ? intersections : INITIAL_INTERSECTIONS;

  const totalVehicles = nodes.reduce((acc, curr) => acc + curr.vehicleCount, 0);
  const avgSpeed = Number((nodes.reduce((acc, curr) => acc + curr.averageSpeedKmH, 0) / nodes.length).toFixed(1));
  const avgWait = Number((nodes.reduce((acc, curr) => acc + curr.waitingTimeMinutes, 0) / nodes.length).toFixed(1));

  // Citywide traffic load % scaled from vehicle capacity
  const maxCapacity = nodes.length * 150;
  const trafficLoadPct = Math.min(98, Math.round((totalVehicles / maxCapacity) * 100));

  // Active trips estimated from queue density
  const activeTrips = Math.round(totalVehicles * 2.4);

  // Carbon savings estimated from optimized nodes
  const optimizedCount = nodes.filter((n) => n.lastOptimizedAt).length;
  const estimatedCo2SavedTons = Number((1.2 + optimizedCount * 0.18).toFixed(2));

  return {
    trafficLoadPct,
    activeTrips,
    estimatedCo2SavedTons,
    averageDelayMinutes: Math.round(avgWait * 3.8),
    averageSpeedKmH: avgSpeed,
    activeCarpoolTrips: 87,
    optimizedSignalsCount: 14 + optimizedCount,
    emergencyCorridorsCleared: 3,
    timestamp: new Date().toLocaleTimeString(),
  };
}
