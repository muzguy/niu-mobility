import { MobilityZone, GeoRoadSegment } from '@/types/geospatial';
import { Intersection, EmergencyCorridor, CongestionLevel, DirectionalSignal, Direction } from '@/types/traffic';
import { INITIAL_INTERSECTIONS } from '@/data/intersections';
import { SimulationTrafficMode } from './simulation-engine';
import { SimulatedIncident } from '@/types/incident';
import { SEEDED_MOBILITY_ZONES } from '@/data/mobility-zones-seed';
import {
  calculateBprSpeed,
  determineTrend,
  BASE_ROAD_CAPACITY_PER_LANE,
  FREE_FLOW_SPEED_KMH,
} from '../traffic/traffic-prediction-engine';
import {
  getIncidentImpactFactors,
  getIncidentTemporalFactor,
} from '../traffic/incident-simulator';

export interface ScenarioConfig {
  demandMultiplier: number;
  speedMultiplier: number;
  delayMultiplier: number;
  queueMultiplier: number;
  emissionMultiplier: number;
  signalEfficiency: number;
  emergencyPriority: boolean;
}

export const SCENARIO_CONFIGS: Record<SimulationTrafficMode, ScenarioConfig> = {
  normal: {
    demandMultiplier: 1.0,
    speedMultiplier: 1.0,
    delayMultiplier: 1.0,
    queueMultiplier: 1.0,
    emissionMultiplier: 1.0,
    signalEfficiency: 0.74,
    emergencyPriority: false,
  },
  rush_hour: {
    demandMultiplier: 1.55,
    speedMultiplier: 0.62,
    delayMultiplier: 1.85,
    queueMultiplier: 1.95,
    emissionMultiplier: 1.62,
    signalEfficiency: 0.48,
    emergencyPriority: false,
  },
  optimized: {
    demandMultiplier: 0.95,
    speedMultiplier: 1.25,
    delayMultiplier: 0.65,
    queueMultiplier: 0.68,
    emissionMultiplier: 0.78,
    signalEfficiency: 0.92,
    emergencyPriority: false,
  },
  emergency: {
    demandMultiplier: 1.15,
    speedMultiplier: 0.88,
    delayMultiplier: 1.35,
    queueMultiplier: 1.30,
    emissionMultiplier: 1.20,
    signalEfficiency: 0.62,
    emergencyPriority: true,
  },
};

export interface AmbulanceSimulationState {
  speedKmH: number;
  travelTimeMinutes: number;
  etaSeconds: number;
  distanceKm: number;
  status: 'idle' | 'en_route' | 'arrived';
}

export interface UnifiedMobilityState {
  scenario: SimulationTrafficMode;
  totalVehicles: number;
  averageSpeedKmH: number;
  trafficLoadPct: number;
  averageDelayMinutes: number;
  averageQueueMeters: number;
  congestionLevel: CongestionLevel;
  fuelLiters: number;
  co2Kg: number;
  co2SavedTons: number;
  fuelSavedLiters: number;
  tripsAvoided: number;
  commuteHoursSaved: number;
  travelTimeMinutes: number;
  signalEfficiencyPct: number;
  niuScore: number;
  trend: 'improving' | 'stable' | 'worsening';
  intersections: Intersection[];
  roads: GeoRoadSegment[];
  emergencyCorridor: EmergencyCorridor;
  ambulance: AmbulanceSimulationState;
  incident: SimulatedIncident | null;
  provenance: {
    roadNetwork: string;
    trafficFlow: string;
    prediction: string;
    incidents: string;
    emissions: string;
    sensors: string;
    timestamp: string;
  };
}

export interface CalculateMobilityStateOptions {
  zone?: MobilityZone;
  scenario?: SimulationTrafficMode;
  incident?: SimulatedIncident | null;
  selectedRouteId?: string | null;
  hour?: number;
}

/**
 * Deterministically computes the unified NIU simulation state for any scenario and incident overlay.
 * Single mathematical source of truth driving the entire mobility platform.
 * Never mutates persistent seed data.
 */
export function calculateMobilityState(
  options: CalculateMobilityStateOptions = {}
): UnifiedMobilityState {
  const scenario = options.scenario || 'normal';
  const zone = options.zone || SEEDED_MOBILITY_ZONES.find((z) => z.id === 'greater-noida-core') || SEEDED_MOBILITY_ZONES[0];
  const incident = options.incident || null;
  const hour = options.hour ?? 10; // Default to mid-morning nominal peak if unspecified

  const config = SCENARIO_CONFIGS[scenario] || SCENARIO_CONFIGS.normal;

  // Incident parameters if active
  const targetIncidentInter = incident
    ? zone.intersections.find((i) => i.id === incident.intersectionId) || null
    : null;
  const incidentAffectedRoadIds = targetIncidentInter ? [...targetIncidentInter.connectedRoadIds] : [];
  const incidentFactors = incident ? getIncidentImpactFactors(incident.type, incident.severity) : null;
  const incidentTemporalFactor = incident ? getIncidentTemporalFactor(incident.durationMinutes, 0) : 0;

  // Emergency corridor definition (Alpha 1 -> Pari Chowk -> Knowledge Park)
  const isEmergencyActive = scenario === 'emergency' || config.emergencyPriority;
  const emergencyCorridorNodeIds = ['alpha-1', 'pari-chowk', 'knowledge-park', 'alpha-1-commercial', 'knowledge-park-iii'];
  const corridorDistanceKm = 5.8;

  // 1. Calculate Intersection States
  const simulatedIntersections: Intersection[] = zone.intersections.map((inter, idx) => {
    const isTargetIncident = Boolean(targetIncidentInter && inter.id === targetIncidentInter.id);
    const isNeighborIncident = Boolean(
      !isTargetIncident &&
      incident &&
      incident.severity === 'major' &&
      inter.connectedRoadIds.some((r) => incidentAffectedRoadIds.includes(r))
    );

    const isCorridorNode = isEmergencyActive && emergencyCorridorNodeIds.some((id) => inter.id.includes(id));

    // Connected roads metadata
    const connectedRoads = zone.roads.filter((r) => inter.connectedRoadIds.includes(r.id));
    const primaryRoad = connectedRoads[0] || {
      id: 'default-road',
      highwayType: 'secondary',
      lanes: 2,
      maxSpeedKph: 45,
    };

    const roadType = primaryRoad.highwayType || 'secondary';
    const laneCount = primaryRoad.lanes || 2;
    let baseCapacity = (BASE_ROAD_CAPACITY_PER_LANE[roadType] || 1050) * laneCount;
    let freeFlowSpeed = primaryRoad.maxSpeedKph || FREE_FLOW_SPEED_KMH[roadType] || 45;

    // Apply Incident Choke
    if (incident && incidentFactors && incidentTemporalFactor > 0) {
      if (isTargetIncident) {
        baseCapacity *= 1 - (1 - incidentFactors.capacityFactor) * incidentTemporalFactor;
        freeFlowSpeed *= 1 - (1 - incidentFactors.speedFactor) * incidentTemporalFactor;
      } else if (isNeighborIncident) {
        baseCapacity *= 1 - 0.15 * incidentTemporalFactor;
      }
    }

    // Deterministic diurnal + seed variance
    const seedVariance = 0.88 + (((idx * 29 + hour * 11) % 25) / 100);
    const baseDemand = baseCapacity * 0.44 * config.demandMultiplier * seedVariance;
    const vcRatio = Math.min(baseDemand / Math.max(1, baseCapacity), 1.6);

    let averageSpeedKmH = calculateBprSpeed(freeFlowSpeed, vcRatio);
    let queueLengthMeters = Math.max(8, Math.round(vcRatio * laneCount * 28 * config.queueMultiplier));
    let waitingTimeMinutes = Math.max(0.6, Number((1.4 + Math.pow(vcRatio, 2.2) * 3.2 * config.delayMultiplier).toFixed(1)));

    // Scenario-specific intersection modulations
    if (scenario === 'optimized') {
      waitingTimeMinutes = Math.max(0.5, Number((waitingTimeMinutes * 0.65).toFixed(1)));
      queueLengthMeters = Math.max(6, Math.round(queueLengthMeters * 0.68));
      averageSpeedKmH = Math.min(Math.round(freeFlowSpeed * 1.05), Math.round(averageSpeedKmH * config.speedMultiplier));
    } else if (isEmergencyActive) {
      if (isCorridorNode) {
        // Green wave along priority corridor
        waitingTimeMinutes = Math.max(0.4, Number((waitingTimeMinutes * 0.28).toFixed(1)));
        averageSpeedKmH = Math.min(Math.round(freeFlowSpeed * 1.15), Math.round(averageSpeedKmH * 1.35));
        queueLengthMeters = Math.max(4, Math.round(queueLengthMeters * 0.45));
      } else {
        // Conflicting cross-arterial traffic receives red pause penalty
        waitingTimeMinutes = Number((waitingTimeMinutes * 1.35).toFixed(1));
        queueLengthMeters = Math.round(queueLengthMeters * 1.25);
        averageSpeedKmH = Math.max(12, Math.round(averageSpeedKmH * 0.85));
      }
    }

    // Apply Incident Choke on delays/queues
    if (incident && incidentFactors && incidentTemporalFactor > 0) {
      if (isTargetIncident) {
        waitingTimeMinutes = Number((waitingTimeMinutes * (1 + (incidentFactors.delayMultiplier - 1) * incidentTemporalFactor)).toFixed(1));
        queueLengthMeters = Math.round(queueLengthMeters * (1 + (incidentFactors.queueMultiplier - 1) * incidentTemporalFactor));
        averageSpeedKmH = Math.max(8, Math.round(averageSpeedKmH * (1 - (1 - incidentFactors.speedFactor) * incidentTemporalFactor)));
      } else if (isNeighborIncident) {
        waitingTimeMinutes = Number((waitingTimeMinutes * 1.18).toFixed(1));
        queueLengthMeters = Math.round(queueLengthMeters * 1.15);
      }
    }

    // Determine Congestion Level
    let congestionLevel: CongestionLevel = 'low';
    if (vcRatio >= 0.85 || queueLengthMeters > 75 || waitingTimeMinutes > 7.0) {
      congestionLevel = 'severe';
    } else if (vcRatio >= 0.55 || queueLengthMeters > 40 || waitingTimeMinutes > 3.5) {
      congestionLevel = 'moderate';
    }

    const vehicleCount = Math.max(15, Math.round(laneCount * 36 * vcRatio * seedVariance));

    // Construct directional signal timings
    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    const signals: DirectionalSignal[] = directions.map((dir) => {
      let state: 'green' | 'yellow' | 'red' = 'green';
      let greenSeconds = 30;
      let redSeconds = 30;

      if (isEmergencyActive && isCorridorNode) {
        // North-South green wave corridor
        if (dir === 'north' || dir === 'south') {
          state = 'green';
          greenSeconds = 55;
          redSeconds = 15;
        } else {
          state = 'red';
          greenSeconds = 15;
          redSeconds = 55;
        }
      } else if (scenario === 'optimized') {
        greenSeconds = Math.round(28 + (vehicleCount % 20));
        redSeconds = Math.max(15, 60 - greenSeconds);
        state = dir === 'north' || dir === 'south' ? 'green' : 'red';
      } else {
        state = dir === 'north' ? 'green' : 'red';
      }

      return {
        direction: dir,
        state,
        greenSeconds,
        yellowSeconds: 4,
        redSeconds,
        vehicleCount: Math.round(vehicleCount / 4),
        queueLengthMeters: Math.round(queueLengthMeters / 4),
        waitingTimeMinutes: Number((waitingTimeMinutes / 2).toFixed(1)),
      };
    });

    const signalTiming: Record<Direction, number> = {
      north: signals.find((s) => s.direction === 'north')?.greenSeconds || 30,
      south: signals.find((s) => s.direction === 'south')?.greenSeconds || 30,
      east: signals.find((s) => s.direction === 'east')?.greenSeconds || 30,
      west: signals.find((s) => s.direction === 'west')?.greenSeconds || 30,
    };

    const initialMatch = INITIAL_INTERSECTIONS.find((i) => i.id === inter.id);
    const resolvedName = inter.name || initialMatch?.name || inter.id;
    const resolvedShortName = initialMatch?.shortName || resolvedName.split(' ')[0];
    const resolvedDescription = initialMatch?.description || `${resolvedName} Monitored Junction`;

    return {
      id: inter.id,
      name: resolvedName,
      shortName: resolvedShortName,
      description: resolvedDescription,
      coordinates: initialMatch?.coordinates || {
        x: Math.round(((inter.longitude - 77.48) / 0.08) * 800 + 100),
        y: Math.round(((28.49 - inter.latitude) / 0.08) * 800 + 100),
      },
      geoCoordinates: initialMatch?.geoCoordinates || {
        lat: inter.latitude,
        lng: inter.longitude,
      },
      connectedIntersectionIds: initialMatch?.connectedIntersectionIds || [],
      congestionLevel,
      vehicleCount,
      averageSpeedKmH,
      queueLengthMeters,
      waitingTimeMinutes,
      signalTiming,
      signals,
      isEmergencyPrioritized: isEmergencyActive && isCorridorNode,
      lastOptimizedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  // 2. Aggregate Network Telemetry
  const totalVehicles = simulatedIntersections.reduce((sum, i) => sum + i.vehicleCount, 0);
  const averageSpeedKmH = Number(
    (simulatedIntersections.reduce((sum, i) => sum + i.averageSpeedKmH, 0) / (simulatedIntersections.length || 1)).toFixed(1)
  );
  const averageDelayMinutes = Number(
    (simulatedIntersections.reduce((sum, i) => sum + i.waitingTimeMinutes, 0) / (simulatedIntersections.length || 1)).toFixed(1)
  );
  const averageQueueMeters = Math.round(
    simulatedIntersections.reduce((sum, i) => sum + i.queueLengthMeters, 0) / (simulatedIntersections.length || 1)
  );

  const severeCount = simulatedIntersections.filter((i) => i.congestionLevel === 'severe').length;
  const modCount = simulatedIntersections.filter((i) => i.congestionLevel === 'moderate').length;
  const trafficLoadPct = Math.min(
    98,
    Math.max(
      15,
      Math.round(
        ((severeCount * 1.0 + modCount * 0.5) / (simulatedIntersections.length || 1)) * 100 * (config.demandMultiplier / 1.1)
      )
    )
  );

  let overallCongestionLevel: CongestionLevel = 'low';
  if (trafficLoadPct >= 75) overallCongestionLevel = 'severe';
  else if (trafficLoadPct >= 45) overallCongestionLevel = 'moderate';

  // 3. Dynamic Thermodynamic Fuel & CO2 Modeling
  // Total trip distance across active network: average 6.5 km per vehicle
  const activeDistanceKm = totalVehicles * 6.5;
  const avgEfficiencyKmPerL = Math.max(9.0, Math.min(18.0, 11.5 + (averageSpeedKmH - 25) * 0.22));
  const runningFuelLiters = activeDistanceKm / avgEfficiencyKmPerL;
  // Idle burn rate: 0.018 liters per minute of queue wait per vehicle
  const idleFuelLiters = totalVehicles * averageDelayMinutes * 0.018;
  const fuelLiters = Math.round(runningFuelLiters + idleFuelLiters);
  const co2Kg = Math.round(fuelLiters * 2.31);

  // Avoided dividends compared against uncoordinated, high-idle reference grid
  const baselineReferenceFuel = Math.round(totalVehicles * 6.5 / 10.2 + totalVehicles * 9.5 * 0.024);
  const fuelSavedLiters = Math.max(120, Math.round(baselineReferenceFuel - fuelLiters + (scenario === 'optimized' ? 320 : 0)));
  const co2SavedTons = Number(((fuelSavedLiters * 2.31) / 1000).toFixed(2));
  const tripsAvoided = Math.round(totalVehicles * (scenario === 'rush_hour' ? 0.38 : scenario === 'optimized' ? 0.45 : 0.40));
  const commuteHoursSaved = Number(((totalVehicles * Math.max(0.5, (6.8 - averageDelayMinutes)) / 60) * 1.5).toFixed(1));

  // 4. Ambulance Simulation (Emergency Corridor Physics)
  let ambulanceSpeedKmH = 32;
  if (scenario === 'emergency') {
    ambulanceSpeedKmH = 52;
  } else if (scenario === 'rush_hour') {
    ambulanceSpeedKmH = 19;
  } else if (scenario === 'optimized') {
    ambulanceSpeedKmH = 38;
  }
  const ambulanceTravelTimeMinutes = Number(((corridorDistanceKm / ambulanceSpeedKmH) * 60).toFixed(1));
  const ambulanceEtaSeconds = Math.round(ambulanceTravelTimeMinutes * 60);

  const emergencyCorridor: EmergencyCorridor = {
    active: isEmergencyActive,
    vehicleId: 'AMB-108',
    vehicleType: 'ambulance',
    origin: 'Alpha 1 Residential Sector',
    destination: 'Knowledge Park Medical Hub',
    routeIntersectionIds: ['alpha-1', 'pari-chowk', 'knowledge-park'],
    normalEtaSeconds: 14 * 60 + 32, // baseline static reference
    niuEtaSeconds: ambulanceEtaSeconds,
    timeSavedSeconds: Math.max(0, (14 * 60 + 32) - ambulanceEtaSeconds),
    currentStep: isEmergencyActive ? 1 : 0,
    progressPct: isEmergencyActive ? 42 : 0,
    status: isEmergencyActive ? 'en_route' : 'idle',
  };

  const ambulance: AmbulanceSimulationState = {
    speedKmH: ambulanceSpeedKmH,
    travelTimeMinutes: ambulanceTravelTimeMinutes,
    etaSeconds: ambulanceEtaSeconds,
    distanceKm: corridorDistanceKm,
    status: isEmergencyActive ? 'en_route' : 'idle',
  };

  // 5. NIU Score Formulation (Bounded 0–100 deterministic composite)
  const speedScore = Math.min(100, Math.max(0, (averageSpeedKmH / 50) * 100));
  const congestionScore = Math.min(100, Math.max(0, 100 - trafficLoadPct));
  const delayScore = Math.min(100, Math.max(0, 100 - (averageDelayMinutes / 15) * 100));
  const signalEffScore = config.signalEfficiency * 100;
  const queueScore = Math.min(100, Math.max(0, 100 - (averageQueueMeters / 120) * 100));

  let rawNiuScore = Math.round(
    speedScore * 0.25 +
    congestionScore * 0.25 +
    delayScore * 0.20 +
    signalEffScore * 0.15 +
    queueScore * 0.15
  );

  // Choke NIU score if active major incident
  if (incident) {
    const incidentPenalty = incident.severity === 'major' ? 18 : incident.severity === 'moderate' ? 10 : 5;
    rawNiuScore = Math.max(15, rawNiuScore - incidentPenalty);
  }

  const niuScore = Math.min(100, Math.max(10, rawNiuScore));

  const trend = determineTrend(
    config.demandMultiplier - 1.0,
    config.delayMultiplier - 1.0
  );

  return {
    scenario,
    totalVehicles,
    averageSpeedKmH,
    trafficLoadPct,
    averageDelayMinutes,
    averageQueueMeters,
    congestionLevel: overallCongestionLevel,
    fuelLiters,
    co2Kg,
    co2SavedTons,
    fuelSavedLiters,
    tripsAvoided,
    commuteHoursSaved,
    travelTimeMinutes: Number((corridorDistanceKm / Math.max(1, averageSpeedKmH) * 60).toFixed(1)),
    signalEfficiencyPct: Math.round(config.signalEfficiency * 100),
    niuScore,
    trend,
    intersections: simulatedIntersections,
    roads: zone.roads,
    emergencyCorridor,
    ambulance,
    incident,
    provenance: {
      roadNetwork: 'REAL (OSM)',
      trafficFlow: 'SIMULATED — NIU UNIFIED DETERMINISTIC MODEL',
      prediction: 'NIU COMPUTED / MODELLED',
      incidents: incident ? 'USER-SIMULATED SCENARIO' : 'SIMULATED',
      emissions: 'ESTIMATED — THERMODYNAMIC IPCC TIER-1',
      sensors: 'PHYSICAL SENSORS NOT CONNECTED',
      timestamp: new Date().toISOString(),
    },
  };
}
