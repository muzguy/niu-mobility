import { INITIAL_INTERSECTIONS } from '@/data/intersections';
import { INITIAL_CITY_METRICS, INITIAL_SIMULATION_EVENTS } from '@/data/traffic';
import { CityMobilityMetrics, SimulationEvent } from '@/types/mobility';
import { EmergencyCorridor, Intersection, CongestionLevel } from '@/types/traffic';
import { applyEmergencyPriority, DEFAULT_EMERGENCY_CORRIDOR } from '../emergency/emergency-engine';
import { aggregateCityMetrics } from '../traffic/traffic-engine';

export interface SimulationState {
  isSimulating: boolean;
  isRushHour: boolean;
  intersections: Intersection[];
  metrics: CityMobilityMetrics;
  events: SimulationEvent[];
  emergencyCorridor: EmergencyCorridor;
  selectedIntersectionId: string | null;
}

export function createInitialSimulationState(): SimulationState {
  return {
    isSimulating: true,
    isRushHour: false,
    intersections: INITIAL_INTERSECTIONS,
    metrics: INITIAL_CITY_METRICS,
    events: INITIAL_SIMULATION_EVENTS,
    emergencyCorridor: DEFAULT_EMERGENCY_CORRIDOR,
    selectedIntersectionId: 'pari-chowk',
  };
}

/**
 * Toggles Rush Hour mode, dynamically scaling traffic volume and queue lengths
 */
export function toggleRushHourState(state: SimulationState): SimulationState {
  const nextRushHour = !state.isRushHour;
  const factor = nextRushHour ? 1.35 : 0.74; // Scale up or down

  const updatedIntersections: Intersection[] = state.intersections.map((node) => {
    const updatedCount = Math.round(node.vehicleCount * factor);
    const updatedQueue = Math.round(node.queueLengthMeters * factor);
    const updatedSpeed = Math.max(12, Math.round(node.averageSpeedKmH / (nextRushHour ? 1.25 : 0.8)));
    const updatedWait = Number((node.waitingTimeMinutes * (nextRushHour ? 1.3 : 0.77)).toFixed(1));

    const congestionLevel: CongestionLevel =
      updatedQueue > 60 || updatedCount > 120
        ? 'severe'
        : updatedQueue > 35
        ? 'moderate'
        : 'low';

    return {
      ...node,
      vehicleCount: updatedCount,
      queueLengthMeters: updatedQueue,
      averageSpeedKmH: updatedSpeed,
      waitingTimeMinutes: updatedWait,
      congestionLevel,
    };
  });

  const updatedMetrics = aggregateCityMetrics(updatedIntersections);

  const rushEvent: SimulationEvent = {
    id: `evt-${Date.now()}`,
    timestamp: 'Just now',
    category: 'traffic',
    title: nextRushHour ? 'Rush Hour Simulation Activated' : 'Rush Hour Inactive (Normal Flow)',
    description: nextRushHour
      ? 'Citywide vehicular volume scaled by +35%. Peak queuing observed along Pari Chowk & Knowledge Park.'
      : 'Vehicular volume normalized. Bottleneck pressure eased across arterial junctions.',
    severity: nextRushHour ? 'warning' : 'info',
  };

  return {
    ...state,
    isRushHour: nextRushHour,
    intersections: updatedIntersections,
    metrics: updatedMetrics,
    events: [rushEvent, ...state.events.slice(0, 14)],
  };
}

/**
 * Activates or deactivates emergency priority simulation
 */
export function toggleEmergencySimulation(state: SimulationState): SimulationState {
  const currentlyActive = state.emergencyCorridor.active;

  if (currentlyActive) {
    // Reset emergency corridor
    const resetIntersections = applyEmergencyPriority(state.intersections, DEFAULT_EMERGENCY_CORRIDOR);
    const cancelEvent: SimulationEvent = {
      id: `evt-${Date.now()}`,
      timestamp: 'Just now',
      category: 'emergency',
      title: 'Emergency Priority Concluded',
      description: 'Ambulance #AMB-108 reached Knowledge Park Medical Hub. Normal signal cycles restored.',
      severity: 'info',
    };

    return {
      ...state,
      emergencyCorridor: DEFAULT_EMERGENCY_CORRIDOR,
      intersections: resetIntersections,
      events: [cancelEvent, ...state.events.slice(0, 14)],
    };
  }

  // Activate emergency priority
  const activeCorridor: EmergencyCorridor = {
    active: true,
    vehicleId: 'AMB-108',
    vehicleType: 'ambulance',
    origin: 'Alpha 1 Residential Sector',
    destination: 'Knowledge Park Medical Hub',
    routeIntersectionIds: ['alpha-1', 'pari-chowk', 'knowledge-park'],
    normalEtaSeconds: 14 * 60 + 32, // 14m 32s
    niuEtaSeconds: 10 * 60 + 51,   // 10m 51s
    timeSavedSeconds: 3 * 60 + 41,  // 3m 41s
    currentStep: 1,
    progressPct: 35,
    status: 'en_route',
  };

  const prioritizedIntersections = applyEmergencyPriority(state.intersections, activeCorridor);

  const emergencyEvent: SimulationEvent = {
    id: `evt-${Date.now()}`,
    timestamp: 'Just now',
    category: 'emergency',
    title: 'Emergency Vehicle Priority Active',
    description: 'Ambulance #AMB-108 in transit. Pre-empting Alpha 1 ➔ Pari Chowk ➔ Knowledge Park corridor with synchronized green wave.',
    severity: 'alert',
  };

  return {
    ...state,
    emergencyCorridor: activeCorridor,
    intersections: prioritizedIntersections,
    events: [emergencyEvent, ...state.events.slice(0, 14)],
  };
}
