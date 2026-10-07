import { GeoRoadSegment } from '@/types/geospatial';
import { MapRoadTraffic, TrafficState } from '@/types/map';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

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

/**
 * Deterministically evaluates road-level traffic telemetry and traffic state
 * based on road classification, lane capacity, diurnal timing, and simulation scenario.
 */
export function classifyRoadTraffic(
  road: GeoRoadSegment,
  scenario: SimulationTrafficMode = 'normal',
  hourOfDay?: number
): MapRoadTraffic {
  const currentHour = hourOfDay ?? new Date().getHours();
  const roadType = (road.highwayType || 'secondary').toLowerCase();
  const lanes = Math.max(1, road.lanes || (roadType === 'motorway' || roadType === 'trunk' ? 3 : 2));

  const baseCapacity = BASE_CAPACITY_PER_LANE[roadType] || 1000;
  const capacityVph = baseCapacity * lanes;
  const freeFlowSpeed = road.maxSpeedKph || FREE_FLOW_SPEED_KMH[roadType] || 45;

  // Diurnal demand multiplier (peaks at 08:00-09:30 and 17:00-18:30)
  let hourMultiplier = 0.55;
  if (currentHour >= 8 && currentHour <= 10) hourMultiplier = 1.35;
  else if (currentHour >= 12 && currentHour <= 14) hourMultiplier = 0.95;
  else if (currentHour >= 16 && currentHour <= 19) hourMultiplier = 1.45;
  else if (currentHour >= 21 || currentHour <= 5) hourMultiplier = 0.25;
  else hourMultiplier = 0.8;

  // Scenario multipliers
  let scenarioMultiplier = 1.0;
  if (scenario === 'rush_hour') scenarioMultiplier = 1.55;
  else if (scenario === 'emergency') scenarioMultiplier = 1.25;
  else if (scenario === 'optimized') scenarioMultiplier = 0.78; // Webster green-split delay reduction

  // Deterministic pseudo-random seed from road ID to preserve unique per-road variance
  let hash = 0;
  for (let i = 0; i < road.id.length; i++) {
    hash = (hash * 31 + road.id.charCodeAt(i)) % 1000;
  }
  const variance = 0.85 + (hash % 30) / 100; // 0.85 to 1.15

  // Compute Volume V and V/C ratio
  const volumeVph = Math.round(capacityVph * 0.45 * hourMultiplier * scenarioMultiplier * variance);
  const vcRatio = Math.min(volumeVph / capacityVph, 1.4);

  // Speed from BPR curve: S = S0 / (1 + 0.25 * (V/C)^3.5)
  const speedKph = Math.max(
    10,
    Math.round(freeFlowSpeed / (1 + 0.25 * Math.pow(vcRatio, 3.5)))
  );

  // Traffic State classification
  let trafficState: TrafficState = 'FREE_FLOW';
  if (vcRatio >= 0.92) {
    trafficState = 'SEVERE';
  } else if (vcRatio >= 0.72) {
    trafficState = 'CONGESTED';
  } else if (vcRatio >= 0.45) {
    trafficState = 'MODERATE';
  }

  // Queue length in meters
  const queueLengthMeters = Math.max(
    0,
    Math.round(vcRatio * lanes * 22 * (scenario === 'optimized' ? 0.65 : 1.0))
  );

  // Occupancy percentage (0 - 100)
  const occupancyPercent = Math.min(100, Math.round(vcRatio * 75));

  // Determine if this road is part of the emergency pre-emption corridor
  const isEmergencyCorridor =
    scenario === 'emergency' &&
    (roadType === 'trunk' || roadType === 'primary' || road.id.includes('expressway') || road.id.includes('service'));

  return {
    roadId: road.id,
    name: road.name || `${roadType.toUpperCase()} Arterial Link`,
    highwayType: roadType,
    lanes,
    trafficState,
    speedKph,
    freeFlowSpeedKph: freeFlowSpeed,
    volumeVph,
    capacityVph,
    occupancyPercent,
    queueLengthMeters,
    isEmergencyCorridor,
    confidence: 0.82,
    source: 'simulation',
  };
}

/**
 * Returns the hex color representing a traffic state
 */
export function getTrafficStateColor(state: TrafficState): string {
  switch (state) {
    case 'FREE_FLOW':
      return '#10b981'; // Green: Low Congestion / Free Flow
    case 'MODERATE':
      return '#f59e0b'; // Yellow: Moderate Congestion
    case 'CONGESTED':
      return '#ef4444'; // Red: Congested
    case 'SEVERE':
      return '#ef4444'; // Red: Severe Congestion
  }
}
