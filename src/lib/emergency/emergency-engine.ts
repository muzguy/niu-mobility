import { EmergencyCorridor, Intersection } from '@/types/traffic';

export const DEFAULT_EMERGENCY_CORRIDOR: EmergencyCorridor = {
  active: false,
  vehicleId: 'AMB-108',
  vehicleType: 'ambulance',
  origin: 'Alpha 1 Residential Sector',
  destination: 'Knowledge Park Medical Hub',
  routeIntersectionIds: ['alpha-1', 'pari-chowk', 'knowledge-park'],
  normalEtaSeconds: 14 * 60 + 32, // 14m 32s (872s)
  niuEtaSeconds: 10 * 60 + 51,   // 10m 51s (651s)
  timeSavedSeconds: 3 * 60 + 41,  // 3m 41s (221s)
  currentStep: 0,
  progressPct: 0,
  status: 'idle',
};

/**
 * Calculates emergency route pre-emption parameters
 */
export function createEmergencyRun(): EmergencyCorridor {
  return {
    ...DEFAULT_EMERGENCY_CORRIDOR,
    active: true,
    status: 'en_route',
    currentStep: 0,
    progressPct: 5,
  };
}

/**
 * Updates intersection states along the emergency corridor to green-wave priority
 */
export function applyEmergencyPriority(
  intersections: Intersection[],
  corridor: EmergencyCorridor
): Intersection[] {
  if (!corridor.active) {
    return intersections.map((item) => ({
      ...item,
      isEmergencyPrioritized: false,
    }));
  }

  return intersections.map((item) => {
    const isTarget = corridor.routeIntersectionIds.includes(item.id);
    if (!isTarget) {
      return { ...item, isEmergencyPrioritized: false };
    }

    // Pre-empt signals: set primary corridor approaches to green and reduce waiting time
    return {
      ...item,
      isEmergencyPrioritized: true,
      waitingTimeMinutes: Math.max(0.5, Number((item.waitingTimeMinutes * 0.35).toFixed(1))),
      averageSpeedKmH: Math.min(55, Math.round(item.averageSpeedKmH * 1.4)),
      signals: item.signals.map((sig) => {
        // North-South priority along main corridor
        if (sig.direction === 'north' || sig.direction === 'south') {
          return {
            ...sig,
            state: 'green',
            greenSeconds: 55,
            redSeconds: 20,
          };
        }
        return {
          ...sig,
          state: 'red',
          greenSeconds: 15,
          redSeconds: 60,
        };
      }),
    };
  });
}
