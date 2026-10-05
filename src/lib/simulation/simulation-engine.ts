import { INITIAL_INTERSECTIONS } from '@/data/intersections';
import { INITIAL_CITY_METRICS, INITIAL_SIMULATION_EVENTS } from '@/data/traffic';
import { CityMobilityMetrics, SimulationEvent } from '@/types/mobility';
import { EmergencyCorridor, Intersection, CongestionLevel } from '@/types/traffic';
import { applyEmergencyPriority, DEFAULT_EMERGENCY_CORRIDOR } from '../emergency/emergency-engine';
import { aggregateCityMetrics } from '../traffic/traffic-engine';
import { optimizeSignalTiming } from '../traffic/signal-optimizer';

export type SimulationTrafficMode = 'normal' | 'rush_hour' | 'emergency' | 'optimized';

export interface SimulationState {
  isSimulating: boolean;
  isRushHour: boolean;
  simulationMode: SimulationTrafficMode;
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
    simulationMode: 'normal',
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
    simulationMode: nextRushHour ? 'rush_hour' : 'normal',
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
      simulationMode: state.isRushHour ? 'rush_hour' : 'normal',
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
    simulationMode: 'emergency',
    emergencyCorridor: activeCorridor,
    intersections: prioritizedIntersections,
    events: [emergencyEvent, ...state.events.slice(0, 14)],
  };
}

/**
 * Directly sets the simulation traffic mode: 'normal' | 'rush_hour' | 'emergency' | 'optimized'
 */
export function setSimulationTrafficMode(
  state: SimulationState,
  mode: SimulationTrafficMode
): SimulationState {
  if (mode === 'normal') {
    const normalIntersections = INITIAL_INTERSECTIONS.map((node) => ({
      ...node,
      isEmergencyPrioritized: false,
    }));
    const metrics = aggregateCityMetrics(normalIntersections);
    const event: SimulationEvent = {
      id: `evt-${Date.now()}`,
      timestamp: 'Just now',
      category: 'traffic',
      title: 'Baseline Traffic Flow Active',
      description: 'Citywide arterial flow returned to nominal daytime baseline across Greater Noida grid.',
      severity: 'info',
    };
    return {
      ...state,
      isRushHour: false,
      simulationMode: 'normal',
      emergencyCorridor: DEFAULT_EMERGENCY_CORRIDOR,
      intersections: normalIntersections,
      metrics,
      events: [event, ...state.events.slice(0, 14)],
    };
  }

  if (mode === 'rush_hour') {
    const factor = 1.35;
    const updatedIntersections: Intersection[] = INITIAL_INTERSECTIONS.map((node) => {
      const updatedCount = Math.round(node.vehicleCount * factor);
      const updatedQueue = Math.round(node.queueLengthMeters * factor);
      const updatedSpeed = Math.max(12, Math.round(node.averageSpeedKmH / 1.25));
      const updatedWait = Number((node.waitingTimeMinutes * 1.3).toFixed(1));

      return {
        ...node,
        isEmergencyPrioritized: false,
        vehicleCount: updatedCount,
        queueLengthMeters: updatedQueue,
        averageSpeedKmH: updatedSpeed,
        waitingTimeMinutes: updatedWait,
        congestionLevel: (updatedQueue > 60 || updatedCount > 120 ? 'severe' : updatedQueue > 35 ? 'moderate' : 'low') as CongestionLevel,
      };
    });

    const metrics = aggregateCityMetrics(updatedIntersections);
    const event: SimulationEvent = {
      id: `evt-${Date.now()}`,
      timestamp: 'Just now',
      category: 'traffic',
      title: 'Rush Hour Simulation Mode Active',
      description: 'Peak rush hour simulated (+35% traffic volume). High congestion at Pari Chowk & Knowledge Park.',
      severity: 'warning',
    };
    return {
      ...state,
      isRushHour: true,
      simulationMode: 'rush_hour',
      emergencyCorridor: DEFAULT_EMERGENCY_CORRIDOR,
      intersections: updatedIntersections,
      metrics,
      events: [event, ...state.events.slice(0, 14)],
    };
  }

  if (mode === 'emergency') {
    const activeCorridor: EmergencyCorridor = {
      active: true,
      vehicleId: 'AMB-108',
      vehicleType: 'ambulance',
      origin: 'Alpha 1 Residential Sector',
      destination: 'Knowledge Park Medical Hub',
      routeIntersectionIds: ['alpha-1', 'pari-chowk', 'knowledge-park'],
      normalEtaSeconds: 14 * 60 + 32,
      niuEtaSeconds: 10 * 60 + 51,
      timeSavedSeconds: 3 * 60 + 41,
      currentStep: 1,
      progressPct: 35,
      status: 'en_route',
    };

    const baseNodes = state.intersections.length ? state.intersections : INITIAL_INTERSECTIONS;
    const prioritizedIntersections = applyEmergencyPriority(baseNodes, activeCorridor);
    const metrics = aggregateCityMetrics(prioritizedIntersections);

    const event: SimulationEvent = {
      id: `evt-${Date.now()}`,
      timestamp: 'Just now',
      category: 'emergency',
      title: 'Emergency Vehicle Priority Active',
      description: 'Ambulance #AMB-108 in transit. Pre-empting Alpha 1 ➔ Pari Chowk ➔ Knowledge Park corridor with synchronized green wave.',
      severity: 'alert',
    };

    return {
      ...state,
      isRushHour: false,
      simulationMode: 'emergency',
      emergencyCorridor: activeCorridor,
      intersections: prioritizedIntersections,
      metrics,
      events: [event, ...state.events.slice(0, 14)],
    };
  }

  if (mode === 'optimized') {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const optimizedIntersections: Intersection[] = INITIAL_INTERSECTIONS.map((node) => {
      const opt = optimizeSignalTiming({
        intersectionId: node.id,
        vehicleDensity: node.vehicleCount,
        queueLength: node.queueLengthMeters,
        waitingTime: node.waitingTimeMinutes,
        currentTiming: node.signalTiming,
        signals: node.signals,
      });

      const updatedQueue = Math.max(10, Math.round(node.queueLengthMeters * 0.70));
      const updatedWait = Math.max(1.0, Number((node.waitingTimeMinutes * 0.68).toFixed(1)));
      const updatedSpeed = Math.min(48, Math.round(node.averageSpeedKmH * 1.25));

      return {
        ...node,
        isEmergencyPrioritized: false,
        signalTiming: opt.recommendedTiming,
        queueLengthMeters: updatedQueue,
        waitingTimeMinutes: updatedWait,
        averageSpeedKmH: updatedSpeed,
        congestionLevel: (updatedQueue > 50 ? 'moderate' : 'low') as CongestionLevel,
        lastOptimizedAt: currentTime,
        signals: node.signals.map((sig) => ({
          ...sig,
          greenSeconds: opt.recommendedTiming[sig.direction] || sig.greenSeconds,
          queueLengthMeters: Math.round(sig.queueLengthMeters * 0.70),
          waitingTimeMinutes: Number((sig.waitingTimeMinutes * 0.68).toFixed(1)),
        })),
      };
    });

    const metrics = aggregateCityMetrics(optimizedIntersections);
    const event: SimulationEvent = {
      id: `evt-${Date.now()}`,
      timestamp: 'Just now',
      category: 'signal',
      title: 'Citywide Webster Optimization Active',
      description: 'Synchronized green splits computed & applied across all 5 monitored junctions. Congestion relieved network-wide.',
      severity: 'success',
    };

    return {
      ...state,
      isRushHour: false,
      simulationMode: 'optimized',
      emergencyCorridor: DEFAULT_EMERGENCY_CORRIDOR,
      intersections: optimizedIntersections,
      metrics,
      events: [event, ...state.events.slice(0, 14)],
    };
  }

  return state;
}
