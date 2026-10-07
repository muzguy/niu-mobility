import { INITIAL_SIMULATION_EVENTS } from '@/data/traffic';
import { CityMobilityMetrics, SimulationEvent } from '@/types/mobility';
import { EmergencyCorridor, Intersection } from '@/types/traffic';
import { calculateMobilityState } from './unified-simulation-state';
import { SimulatedIncident } from '@/types/incident';

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
  const unified = calculateMobilityState({ scenario: 'normal' });
  return {
    isSimulating: true,
    isRushHour: false,
    simulationMode: 'normal',
    intersections: unified.intersections,
    metrics: {
      trafficLoadPct: unified.trafficLoadPct,
      activeTrips: unified.totalVehicles,
      estimatedCo2SavedTons: unified.co2SavedTons,
      averageDelayMinutes: unified.averageDelayMinutes,
      averageSpeedKmH: unified.averageSpeedKmH,
      activeCarpoolTrips: Math.round(unified.totalVehicles * 0.28),
      optimizedSignalsCount: 2,
      emergencyCorridorsCleared: 1,
      timestamp: new Date().toISOString(),
    },
    events: INITIAL_SIMULATION_EVENTS,
    emergencyCorridor: unified.emergencyCorridor,
    selectedIntersectionId: 'pari-chowk',
  };
}

/**
 * Toggles Rush Hour mode deterministically via unified simulation state
 */
export function toggleRushHourState(state: SimulationState): SimulationState {
  const nextMode = state.simulationMode === 'rush_hour' ? 'normal' : 'rush_hour';
  return setSimulationTrafficMode(state, nextMode);
}

/**
 * Activates or deactivates emergency priority simulation deterministically
 */
export function toggleEmergencySimulation(state: SimulationState): SimulationState {
  const nextMode = state.simulationMode === 'emergency' ? 'normal' : 'emergency';
  return setSimulationTrafficMode(state, nextMode);
}

/**
 * Directly sets the simulation traffic mode: 'normal' | 'rush_hour' | 'emergency' | 'optimized'
 */
export function setSimulationTrafficMode(
  state: SimulationState,
  mode: SimulationTrafficMode,
  incident?: SimulatedIncident | null
): SimulationState {
  const unified = calculateMobilityState({ scenario: mode, incident });

  let eventTitle = 'Baseline Traffic Flow Active';
  let eventDesc = 'Citywide arterial flow returned to nominal daytime baseline across Greater Noida grid.';
  let eventSeverity: SimulationEvent['severity'] = 'info';

  if (mode === 'rush_hour') {
    eventTitle = 'Rush Hour Simulation Mode Active';
    eventDesc = `Peak rush hour simulated (+55% traffic volume). Arterial delay surging to ${unified.averageDelayMinutes} min.`;
    eventSeverity = 'warning';
  } else if (mode === 'emergency') {
    eventTitle = 'Emergency Vehicle Priority Active';
    eventDesc = `Ambulance #AMB-108 in transit. Pre-empting Alpha 1 ➔ Pari Chowk ➔ Knowledge Park corridor (ETA: ${unified.ambulance.travelTimeMinutes} min).`;
    eventSeverity = 'alert';
  } else if (mode === 'optimized') {
    eventTitle = 'Citywide Webster Optimization Active';
    eventDesc = `Adaptive signal splits balanced across all monitored nodes. Average delay mitigated to ${unified.averageDelayMinutes} min.`;
    eventSeverity = 'success';
  }

  const event: SimulationEvent = {
    id: `evt-${Date.now()}`,
    timestamp: 'Just now',
    category: mode === 'emergency' ? 'emergency' : mode === 'optimized' ? 'signal' : 'traffic',
    title: eventTitle,
    description: eventDesc,
    severity: eventSeverity,
  };

  return {
    ...state,
    isRushHour: mode === 'rush_hour',
    simulationMode: mode,
    emergencyCorridor: unified.emergencyCorridor,
    intersections: unified.intersections,
    metrics: {
      trafficLoadPct: unified.trafficLoadPct,
      activeTrips: unified.totalVehicles,
      estimatedCo2SavedTons: unified.co2SavedTons,
      averageDelayMinutes: unified.averageDelayMinutes,
      averageSpeedKmH: unified.averageSpeedKmH,
      activeCarpoolTrips: Math.round(unified.totalVehicles * 0.28),
      optimizedSignalsCount: mode === 'optimized' ? unified.intersections.length : 2,
      emergencyCorridorsCleared: mode === 'emergency' ? 1 : 0,
      timestamp: new Date().toISOString(),
    },
    events: [event, ...state.events.slice(0, 14)],
  };
}
