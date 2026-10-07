import { MobilityZone, GeoRoadSegment } from '@/types/geospatial';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import {
  IncidentType,
  IncidentSeverity,
  IncidentDurationMinutes,
  SimulatedIncident,
  IncidentImpactMetrics,
  MetricComparisonItem,
  IncidentSimulationResult,
  HorizonImpactComparison,
} from '@/types/incident';
import {
  calculateBprSpeed,
  getInterpolatedDiurnalFactor,
  determineTrend,
  BASE_ROAD_CAPACITY_PER_LANE,
  FREE_FLOW_SPEED_KMH,
} from './traffic-prediction-engine';

export interface SimulateIncidentOptions {
  type: IncidentType;
  intersectionId: string;
  severity: IncidentSeverity;
  durationMinutes: IncidentDurationMinutes;
  baseHour?: number;
  scenario?: SimulationTrafficMode;
}

export interface IncidentImpactFactors {
  capacityFactor: number;
  delayMultiplier: number;
  speedFactor: number;
  queueMultiplier: number;
}

/**
 * Returns deterministic capacity and delay multipliers based on incident type and severity.
 */
export function getIncidentImpactFactors(
  type: IncidentType,
  severity: IncidentSeverity
): IncidentImpactFactors {
  switch (type) {
    case 'accident':
      if (severity === 'major') return { capacityFactor: 0.25, delayMultiplier: 2.30, speedFactor: 0.45, queueMultiplier: 2.40 };
      if (severity === 'moderate') return { capacityFactor: 0.50, delayMultiplier: 1.65, speedFactor: 0.65, queueMultiplier: 1.70 };
      return { capacityFactor: 0.70, delayMultiplier: 1.30, speedFactor: 0.85, queueMultiplier: 1.35 };

    case 'road_work':
      if (severity === 'major') return { capacityFactor: 0.35, delayMultiplier: 1.95, speedFactor: 0.50, queueMultiplier: 2.00 };
      if (severity === 'moderate') return { capacityFactor: 0.55, delayMultiplier: 1.50, speedFactor: 0.70, queueMultiplier: 1.55 };
      return { capacityFactor: 0.75, delayMultiplier: 1.22, speedFactor: 0.88, queueMultiplier: 1.25 };

    case 'lane_blockage':
      if (severity === 'major') return { capacityFactor: 0.30, delayMultiplier: 2.10, speedFactor: 0.52, queueMultiplier: 2.20 };
      if (severity === 'moderate') return { capacityFactor: 0.52, delayMultiplier: 1.58, speedFactor: 0.72, queueMultiplier: 1.60 };
      return { capacityFactor: 0.72, delayMultiplier: 1.28, speedFactor: 0.86, queueMultiplier: 1.30 };

    case 'emergency':
      if (severity === 'major') return { capacityFactor: 0.20, delayMultiplier: 2.50, speedFactor: 0.40, queueMultiplier: 2.60 };
      if (severity === 'moderate') return { capacityFactor: 0.45, delayMultiplier: 1.75, speedFactor: 0.60, queueMultiplier: 1.80 };
      return { capacityFactor: 0.65, delayMultiplier: 1.35, speedFactor: 0.80, queueMultiplier: 1.40 };
  }
}

/**
 * Computes temporal decay factor of the incident over the projection horizon.
 */
export function getIncidentTemporalFactor(
  durationMinutes: IncidentDurationMinutes,
  horizonMinutes: number
): number {
  if (horizonMinutes <= durationMinutes) {
    return 1.0; // Fully active
  }
  const clearedMinutesAgo = horizonMinutes - durationMinutes;
  if (clearedMinutesAgo <= 10) {
    return 0.25; // Residual dissipating queue
  }
  return 0.0; // Completely cleared
}

/**
 * Deterministically simulates a what-if traffic incident scenario on top of a Mobility Zone.
 * Never mutates the original zone seed data.
 */
export function simulateMobilityIncident(
  zone: MobilityZone,
  options: SimulateIncidentOptions
): IncidentSimulationResult {
  const baseHour = options.baseHour ?? new Date().getHours();
  const scenario = options.scenario ?? 'normal';
  const { type, intersectionId, severity, durationMinutes } = options;

  // Resolve target intersection
  const targetInter = zone.intersections.find((i) => i.id === intersectionId) || zone.intersections[0];
  const affectedRoadIds = [...targetInter.connectedRoadIds];
  const affectedIntersectionIds = [targetInter.id];

  const impactFactors = getIncidentImpactFactors(type, severity);

  const incident: SimulatedIncident = {
    id: `incident-${type}-${intersectionId}-${Date.now()}`,
    type,
    intersectionId: targetInter.id,
    intersectionName: targetInter.name || 'Target Junction',
    severity,
    durationMinutes,
    startedAt: new Date().toISOString(),
    coordinates: {
      lat: targetInter.latitude,
      lng: targetInter.longitude,
    },
    description: `Simulated ${severity.toUpperCase()} ${type.replace('_', ' ').toUpperCase()} at ${targetInter.name || 'Junction'} (duration: ${durationMinutes} min).`,
  };

  // Helper to compute network metrics at a specific horizon with or without incident
  const computeNetworkState = (minutesAhead: number, applyIncident: boolean) => {
    const diurnalFactor = getInterpolatedDiurnalFactor(baseHour, minutesAhead);
    const temporalFactor = applyIncident ? getIncidentTemporalFactor(durationMinutes, minutesAhead) : 0;

    let scenarioMultiplier = 1.0;
    if (scenario === 'rush_hour') scenarioMultiplier = 1.55 + (minutesAhead / 30) * 0.12;
    else if (scenario === 'emergency') scenarioMultiplier = 1.25;
    else if (scenario === 'optimized') scenarioMultiplier = Math.max(0.68, 0.78 - (minutesAhead / 30) * 0.08);

    const interMetrics = zone.intersections.map((inter, idx) => {
      const isTarget = inter.id === targetInter.id;
      const isNeighbor = !isTarget && inter.connectedRoadIds.some((r) => affectedRoadIds.includes(r));

      const connectedRoads = zone.roads.filter((r) => inter.connectedRoadIds.includes(r.id));
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
      let capacityPerHour = (BASE_ROAD_CAPACITY_PER_LANE[roadType] || 1000) * laneCount;
      let freeFlowSpeed = primaryRoad.maxSpeedKph || FREE_FLOW_SPEED_KMH[roadType] || 45;

      // Apply incident capacity / speed choke if active
      if (applyIncident && temporalFactor > 0) {
        if (isTarget) {
          const effectiveCapFactor = 1 - (1 - impactFactors.capacityFactor) * temporalFactor;
          capacityPerHour *= effectiveCapFactor;
          freeFlowSpeed *= (1 - (1 - impactFactors.speedFactor) * temporalFactor);
        } else if (isNeighbor && severity === 'major') {
          // Secondary spillover to immediate neighbors
          capacityPerHour *= (1 - 0.15 * temporalFactor);
        }
      }

      const seedVariance = 0.85 + (((idx * 37 + baseHour * 13) % 30) / 100);
      const effectiveDemand = capacityPerHour * 0.45 * diurnalFactor * scenarioMultiplier * seedVariance;
      const vcRatio = Math.min(effectiveDemand / capacityPerHour, 1.6);

      let speedKmH = calculateBprSpeed(freeFlowSpeed, vcRatio);
      let queueMeters = Math.max(6, Math.round(vcRatio * (laneCount * 28)));
      let delayMinutes = Math.max(0.5, Number((1.2 + Math.pow(vcRatio, 2.2) * 3.4).toFixed(1)));

      if (applyIncident && temporalFactor > 0) {
        if (isTarget) {
          const effectiveDelayMult = 1 + (impactFactors.delayMultiplier - 1) * temporalFactor;
          delayMinutes = Number((delayMinutes * effectiveDelayMult).toFixed(1));
          queueMeters = Math.round(queueMeters * (1 + (impactFactors.queueMultiplier - 1) * temporalFactor));
          speedKmH = Math.max(10, Math.round(speedKmH * (1 - (1 - impactFactors.speedFactor) * temporalFactor)));
        } else if (isNeighbor && severity === 'major') {
          delayMinutes = Number((delayMinutes * (1 + 0.18 * temporalFactor)).toFixed(1));
          queueMeters = Math.round(queueMeters * (1 + 0.15 * temporalFactor));
        }
      }

      return {
        id: inter.id,
        vehicleCount: Math.max(12, Math.round(laneCount * 35 * vcRatio * seedVariance)),
        speedKmH,
        queueMeters,
        delayMinutes,
        vcRatio,
      };
    });

    const totalVehicles = interMetrics.reduce((sum, i) => sum + i.vehicleCount, 0);
    const avgSpeed = Number((interMetrics.reduce((sum, i) => sum + i.speedKmH, 0) / (interMetrics.length || 1)).toFixed(1));
    const avgDelay = Number((interMetrics.reduce((sum, i) => sum + i.delayMinutes, 0) / (interMetrics.length || 1)).toFixed(1));
    const avgQueue = Math.round(interMetrics.reduce((sum, i) => sum + i.queueMeters, 0) / (interMetrics.length || 1));

    const highLoadCount = interMetrics.filter((i) => i.vcRatio >= 0.75).length;
    const trafficLoadPct = Math.min(98, Math.round((highLoadCount / (interMetrics.length || 1)) * 80 + (scenario === 'rush_hour' ? 18 : 0)));

    // Thermodynamic CO2 calculation
    const baseCo2Tons = Number(((totalVehicles * 2.8 * 3.2 * 0.165) / 1000).toFixed(2));
    const idlePenaltyTons = Number(((totalVehicles * avgDelay * 0.014) / 1000).toFixed(2));
    const estimatedCo2Tons = Number((baseCo2Tons + idlePenaltyTons).toFixed(2));

    return {
      trafficLoadPct,
      averageSpeedKmH: avgSpeed,
      averageDelayMinutes: avgDelay,
      averageQueueMeters: avgQueue,
      estimatedCo2Tons,
      totalVehicles,
    };
  };

  // 1. Compute NOW state
  const baseNow = computeNetworkState(0, false);
  const incidentNow = computeNetworkState(0, true);

  // 2. Compute +15m state
  const base15 = computeNetworkState(15, false);
  const incident15 = computeNetworkState(15, true);

  // 3. Compute +30m state
  const base30 = computeNetworkState(30, false);
  const incident30 = computeNetworkState(30, true);

  // Determine trend for without and with incident
  const withoutTrend = determineTrend(
    (base30.totalVehicles - baseNow.totalVehicles) / Math.max(baseNow.totalVehicles, 1),
    (base30.averageDelayMinutes - baseNow.averageDelayMinutes) / Math.max(baseNow.averageDelayMinutes, 0.5)
  );

  const withTrend = determineTrend(
    (incident30.totalVehicles - incidentNow.totalVehicles) / Math.max(incidentNow.totalVehicles, 1),
    (incident30.averageDelayMinutes - incidentNow.averageDelayMinutes) / Math.max(incidentNow.averageDelayMinutes, 0.5)
  );

  const withoutIncident: IncidentImpactMetrics = {
    trafficLoadPct: baseNow.trafficLoadPct,
    averageSpeedKmH: baseNow.averageSpeedKmH,
    averageDelayMinutes: baseNow.averageDelayMinutes,
    averageQueueMeters: baseNow.averageQueueMeters,
    estimatedCo2Tons: baseNow.estimatedCo2Tons,
    trend: withoutTrend,
  };

  const withIncident: IncidentImpactMetrics = {
    trafficLoadPct: incidentNow.trafficLoadPct,
    averageSpeedKmH: incidentNow.averageSpeedKmH,
    averageDelayMinutes: incidentNow.averageDelayMinutes,
    averageQueueMeters: incidentNow.averageQueueMeters,
    estimatedCo2Tons: incidentNow.estimatedCo2Tons,
    trend: withTrend,
  };

  // Build comparison items
  const buildComparison = (
    metric: string,
    unit: string,
    before: number,
    after: number,
    higherIsWorse: boolean
  ): MetricComparisonItem => {
    const delta = Number((after - before).toFixed(1));
    const deltaPercent = before !== 0 ? Number(((delta / before) * 100).toFixed(1)) : 0;
    let status: 'worsened' | 'improved' | 'unchanged' = 'unchanged';
    if (delta !== 0) {
      if (higherIsWorse) {
        status = delta > 0 ? 'worsened' : 'improved';
      } else {
        status = delta < 0 ? 'worsened' : 'improved';
      }
    }
    return { metric, unit, before, after, delta, deltaPercent, status };
  };

  const comparison: MetricComparisonItem[] = [
    buildComparison('Traffic Load', '%', withoutIncident.trafficLoadPct, withIncident.trafficLoadPct, true),
    buildComparison('Average Speed', 'km/h', withoutIncident.averageSpeedKmH, withIncident.averageSpeedKmH, false),
    buildComparison('Average Delay', 'min', withoutIncident.averageDelayMinutes, withIncident.averageDelayMinutes, true),
    buildComparison('Queue Length', 'm', withoutIncident.averageQueueMeters, withIncident.averageQueueMeters, true),
    buildComparison('Estimated CO2', 'tons', withoutIncident.estimatedCo2Tons, withIncident.estimatedCo2Tons, true),
  ];

  // Horizon comparisons
  const horizons: Record<'now' | 'plus_15m' | 'plus_30m', HorizonImpactComparison> = {
    now: {
      withoutDelayMin: baseNow.averageDelayMinutes,
      withDelayMin: incidentNow.averageDelayMinutes,
      withoutSpeedKmH: baseNow.averageSpeedKmH,
      withSpeedKmH: incidentNow.averageSpeedKmH,
      withoutLoadPct: baseNow.trafficLoadPct,
      withLoadPct: incidentNow.trafficLoadPct,
      trend: 'worsening',
    },
    plus_15m: {
      withoutDelayMin: base15.averageDelayMinutes,
      withDelayMin: incident15.averageDelayMinutes,
      withoutSpeedKmH: base15.averageSpeedKmH,
      withSpeedKmH: incident15.averageSpeedKmH,
      withoutLoadPct: base15.trafficLoadPct,
      withLoadPct: incident15.trafficLoadPct,
      trend: durationMinutes <= 10 ? 'improving' : 'worsening',
    },
    plus_30m: {
      withoutDelayMin: base30.averageDelayMinutes,
      withDelayMin: incident30.averageDelayMinutes,
      withoutSpeedKmH: base30.averageSpeedKmH,
      withSpeedKmH: incident30.averageSpeedKmH,
      withoutLoadPct: base30.trafficLoadPct,
      withLoadPct: incident30.trafficLoadPct,
      trend: durationMinutes < 30 ? 'improving' : 'stable',
    },
  };

  // Generate actionable recommendation
  const delaySpikePct = ((withIncident.averageDelayMinutes - withoutIncident.averageDelayMinutes) / Math.max(withoutIncident.averageDelayMinutes, 0.5)) * 100;

  let recTitle = `Simulated Incident Impact: ${severity.toUpperCase()} ${type.replace('_', ' ').toUpperCase()}`;
  let recAction = `NIU recommends diverting approaching arterial traffic away from ${targetInter.name} to adjacent bypass corridors.`;
  let recSeverity: 'advisory' | 'warning' | 'critical' = 'warning';

  if (severity === 'major' || delaySpikePct >= 40) {
    recTitle = `Critical Choke Warning: ${targetInter.name} Severely Constrained`;
    recAction = `NIU recommends activating emergency signal flush (+15s green split on arterial axis), enforcing dynamic detour via Alpha 1 bypass, and clearing emergency corridor.`;
    recSeverity = 'critical';
  } else if (severity === 'minor') {
    recTitle = `Localized Congestion Advisory: ${targetInter.name}`;
    recAction = `Maintain lane advisory signage and adjust cycle splits by +6s on approaching legs to buffer queue accumulation.`;
    recSeverity = 'advisory';
  }

  const recMessage = `Simulated ${severity} ${type.replace('_', ' ')} induces a ${delaySpikePct.toFixed(1)}% surge in average delay (spiking to ${withIncident.averageDelayMinutes} min) and drops corridor speeds by ${(withoutIncident.averageSpeedKmH - withIncident.averageSpeedKmH).toFixed(1)} km/h across ${zone.name}.`;

  return {
    incident,
    affectedRoadIds,
    affectedIntersectionIds,
    withoutIncident,
    withIncident,
    comparison,
    horizons,
    recommendation: {
      title: recTitle,
      message: recMessage,
      action: recAction,
      severity: recSeverity,
    },
    provenance: {
      source: 'modelled',
      truthStatement:
        'Road Network = REAL (OSM) | Traffic = SIMULATED | Incident = USER-SIMULATED SCENARIO | Traffic Prediction = NIU COMPUTED / MODELLED | Physical Sensors = NOT CONNECTED',
      notes: `Deterministic What-If mobility incident model. Tested scenario: ${severity} ${type} at ${targetInter.name}. No live municipal IoT feed connected.`,
      provider: 'NIU What-If Incident Simulator Engine v1 (Deterministic)',
      timestamp: new Date().toISOString(),
    },
  };
}
