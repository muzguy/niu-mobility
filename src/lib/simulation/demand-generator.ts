import {
  GeoRoadSegment,
  MobilityZone,
  DataProvenance,
} from '@/types/geospatial';
import {
  Intersection,
  CongestionLevel,
  DirectionalSignal,
  Direction,
} from '@/types/traffic';
import { CityMobilityMetrics } from '@/types/mobility';
import { SimulationTrafficMode } from './simulation-engine';

export interface DemandModelOptions {
  hourOfDay?: number; // 0-23 (defaults to current local hour)
  isWeekend?: boolean;
  scenarioMode?: SimulationTrafficMode;
}

export interface ZoneSimulationOutput {
  zoneId: string;
  intersections: Intersection[];
  metrics: CityMobilityMetrics;
  totalVehiclesApproaching: number;
  averageQueueMeters: number;
  averageWaitMinutes: number;
  activeCorridor: string;
  provenance: DataProvenance;
}

// Diurnal hourly multiplier for university / mixed-use educational corridors
const UNIVERSITY_DIURNAL_CURVE: Record<number, number> = {
  0: 0.12,
  1: 0.08,
  2: 0.06,
  3: 0.07,
  4: 0.15,
  5: 0.35,
  6: 0.65,
  7: 0.95,
  8: 1.42, // Morning arrival peak
  9: 1.55, // Academic class start peak
  10: 1.05,
  11: 0.95,
  12: 1.18, // Mid-day transit
  13: 1.12,
  14: 0.98,
  15: 1.15,
  16: 1.35, // Afternoon departure surge
  17: 1.52, // Evening exit rush
  18: 1.45,
  19: 1.08,
  20: 0.78,
  21: 0.55,
  22: 0.38,
  23: 0.22,
};

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
 * Deterministically generates synthetic traffic telemetry for any given MobilityZone
 * based on road classification, lane capacity, diurnal timing, and nearby POIs.
 */
export function generateZoneTrafficDemand(
  zone: MobilityZone,
  options: DemandModelOptions = {}
): ZoneSimulationOutput {
  const currentHour = options.hourOfDay ?? new Date().getHours();
  const isWeekend = options.isWeekend ?? [0, 6].includes(new Date().getDay());
  const scenario = options.scenarioMode ?? 'normal';

  // Base diurnal demand factor
  let diurnalFactor = UNIVERSITY_DIURNAL_CURVE[currentHour] || 1.0;
  if (isWeekend) diurnalFactor *= 0.65; // Weekend load reduction

  // Scenario multipliers
  let scenarioMultiplier = 1.0;
  if (scenario === 'rush_hour') scenarioMultiplier = 1.55;
  if (scenario === 'emergency') scenarioMultiplier = 1.25;
  if (scenario === 'optimized') scenarioMultiplier = 0.82;

  const simulatedIntersections: Intersection[] = zone.intersections.map(
    (inter, index) => {
      // Find connected roads
      const connectedRoads = zone.roads.filter((r) =>
        inter.connectedRoadIds.includes(r.id)
      );

      // Primary road driving capacity
      const primaryRoad: GeoRoadSegment = connectedRoads[0] || {
        id: 'default-road',
        coordinates: [],
        highwayType: 'secondary',
        lanes: 2,
        maxSpeedKph: 50,
        source: 'seed',
      };

      const roadType = primaryRoad.highwayType || 'secondary';
      const laneCount = primaryRoad.lanes || 2;
      const capacityPerHour = (BASE_CAPACITY_PER_LANE[roadType] || 1000) * laneCount;
      const freeFlowSpeed = primaryRoad.maxSpeedKph || FREE_FLOW_SPEED_KMH[roadType] || 45;

      // Deterministic pseudo-random seed based on zone id and intersection index
      const seedVariance = 0.85 + (((index * 37 + currentHour * 13) % 30) / 100);

      // Volume-to-Capacity ratio
      const effectiveDemand = capacityPerHour * 0.45 * diurnalFactor * scenarioMultiplier * seedVariance;
      const vcRatio = Math.min(effectiveDemand / capacityPerHour, 1.35);

      // Congestion Level classification
      let congestionLevel: CongestionLevel = 'low';
      if (vcRatio >= 0.82) congestionLevel = 'severe';
      else if (vcRatio >= 0.52) congestionLevel = 'moderate';

      // Speed from BPR curve: S = S0 / (1 + 0.15 * (V/C)^4)
      const speedKmH = Math.max(
        12,
        Math.round(freeFlowSpeed / (1 + 0.25 * Math.pow(vcRatio, 3.5)))
      );

      // Vehicle count approaching
      const vehicleCount = Math.max(
        15,
        Math.round(laneCount * 35 * vcRatio * seedVariance)
      );

      // Queue length (meters)
      const queueLengthMeters = Math.max(
        8,
        Math.round(vcRatio * (laneCount * 28) * (scenario === 'optimized' ? 0.7 : 1.0))
      );

      // Average wait time (minutes)
      const waitingTimeMinutes = Math.max(
        0.6,
        Number(
          (
            1.2 +
            Math.pow(vcRatio, 2.2) * 3.4 * (scenario === 'optimized' ? 0.65 : 1.0)
          ).toFixed(1)
        )
      );

      // Deterministic Directional Signals
      const directions: Direction[] = ['north', 'south', 'east', 'west'];
      const signals: DirectionalSignal[] = directions.map((dir, dIdx) => {
        const isNorthSouth = dir === 'north' || dir === 'south';
        const dirWeight = isNorthSouth ? 0.58 : 0.42;
        const dirVehicles = Math.round(vehicleCount * dirWeight * (dIdx % 2 === 0 ? 1.05 : 0.95));
        const dirQueue = Math.round(queueLengthMeters * dirWeight);

        return {
          direction: dir,
          greenSeconds: isNorthSouth ? (scenario === 'optimized' ? 44 : 32) : 22,
          yellowSeconds: 4,
          redSeconds: isNorthSouth ? 34 : 52,
          state: (dIdx === 0 ? 'green' : 'red') as 'green' | 'yellow' | 'red',
          queueLengthMeters: dirQueue,
          vehicleCount: dirVehicles,
          waitingTimeMinutes: Number((waitingTimeMinutes * (isNorthSouth ? 0.9 : 1.15)).toFixed(1)),
        };
      });

      return {
        id: inter.id,
        name: inter.name || `${zone.name} - Junction ${index + 1}`,
        shortName: inter.name ? inter.name.split(' ')[0] : `J${index + 1}`,
        coordinates: {
          x: 200 + ((index * 260) % 600),
          y: 200 + ((index * 180) % 500),
        },
        geoCoordinates: {
          lat: inter.latitude,
          lng: inter.longitude,
        },
        vehicleCount,
        averageSpeedKmH: speedKmH,
        queueLengthMeters,
        waitingTimeMinutes,
        congestionLevel,
        signalTiming: {
          north: scenario === 'optimized' ? 44 : 32,
          south: scenario === 'optimized' ? 44 : 32,
          east: scenario === 'optimized' ? 26 : 22,
          west: scenario === 'optimized' ? 26 : 22,
        },
        signals,
        description: `Synthetic demand generated for ${inter.name || 'Junction'} in ${zone.name}. Road category: ${roadType.toUpperCase()} (${laneCount} lanes).`,
        connectedIntersectionIds: inter.connectedRoadIds,
        lastOptimizedAt: scenario === 'optimized' ? new Date().toISOString() : undefined,
      };
    }
  );

  const totalVehiclesApproaching = simulatedIntersections.reduce(
    (sum, item) => sum + item.vehicleCount,
    0
  );
  const averageQueueMeters = Math.round(
    simulatedIntersections.reduce((sum, item) => sum + item.queueLengthMeters, 0) /
      (simulatedIntersections.length || 1)
  );
  const averageWaitMinutes = Number(
    (
      simulatedIntersections.reduce(
        (sum, item) => sum + item.waitingTimeMinutes,
        0
      ) / (simulatedIntersections.length || 1)
    ).toFixed(1)
  );
  const avgSpeed = Number(
    (
      simulatedIntersections.reduce(
        (sum, item) => sum + item.averageSpeedKmH,
        0
      ) / (simulatedIntersections.length || 1)
    ).toFixed(1)
  );

  const metrics: CityMobilityMetrics = {
    trafficLoadPct: Math.min(
      95,
      Math.round(
        (simulatedIntersections.filter((i) => i.congestionLevel !== 'low').length /
          (simulatedIntersections.length || 1)) *
          80 +
          (scenario === 'rush_hour' ? 18 : 0)
      )
    ),
    activeTrips: Math.round(totalVehiclesApproaching * 2.8),
    estimatedCo2SavedTons: Number(
      (0.85 + (scenario === 'optimized' ? 0.65 : 0.15)).toFixed(2)
    ),
    averageDelayMinutes: Math.round(averageWaitMinutes * 2.2),
    averageSpeedKmH: avgSpeed,
    activeCarpoolTrips: Math.round(totalVehiclesApproaching * 0.18),
    optimizedSignalsCount: scenario === 'optimized' ? simulatedIntersections.length : 2,
    emergencyCorridorsCleared: scenario === 'emergency' ? 1 : 0,
    timestamp: new Date().toISOString(),
  };

  const primaryInter = simulatedIntersections[0];
  const lastInter = simulatedIntersections[simulatedIntersections.length - 1];
  const activeCorridor =
    simulatedIntersections.length > 1
      ? `${primaryInter.shortName} ➔ ${lastInter.shortName}`
      : `${zone.name} Arterial Axis`;

  return {
    zoneId: zone.id,
    intersections: simulatedIntersections,
    metrics,
    totalVehiclesApproaching,
    averageQueueMeters,
    averageWaitMinutes,
    activeCorridor,
    provenance: {
      source: 'simulation',
      confidence: 0.76,
      freshness: new Date().toISOString(),
      notes: `Deterministic synthetic demand model for ${zone.name}. Diurnal factor: ${diurnalFactor.toFixed(2)}, Scenario: ${scenario}. No live municipal IoT feed connected.`,
      provider: 'NIU Synthetic Demand Engine v1',
    },
  };
}
