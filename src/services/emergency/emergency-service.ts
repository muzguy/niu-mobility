import { getRepository } from '@/lib/repositories';
import {
  createEmergencyRun,
  DEFAULT_EMERGENCY_CORRIDOR,
  applyEmergencyPriority,
} from '@/lib/emergency/emergency-engine';
import {
  createInitialSimulationState,
} from '@/lib/simulation/simulation-engine';
import { EmergencyCorridor, Intersection } from '@/types/traffic';

declare global {
  var __niu_backend_simulation_state: ReturnType<typeof createInitialSimulationState> | undefined;
}

function getBackendSimulationState() {
  if (!globalThis.__niu_backend_simulation_state) {
    globalThis.__niu_backend_simulation_state = createInitialSimulationState();
  }
  return globalThis.__niu_backend_simulation_state;
}

export class EmergencyService {
  private repo = getRepository();

  public async getEmergencyStatus(): Promise<{
    corridor: EmergencyCorridor;
    prioritizedIntersections: string[];
    timestamp: string;
  }> {
    const simState = getBackendSimulationState();
    return {
      corridor: simState.emergencyCorridor,
      prioritizedIntersections: simState.emergencyCorridor.active
        ? simState.emergencyCorridor.routeIntersectionIds
        : [],
      timestamp: new Date().toISOString(),
    };
  }

  public async setEmergencyPriority(
    action: 'activate' | 'cancel' | 'toggle',
    vehicleId = 'AMB-108'
  ): Promise<{
    corridor: EmergencyCorridor;
    intersections: Intersection[];
    eventLogged: boolean;
  }> {
    const simState = getBackendSimulationState();
    const isCurrentlyActive = simState.emergencyCorridor.active;

    let shouldActivate = false;
    if (action === 'activate') shouldActivate = true;
    else if (action === 'cancel') shouldActivate = false;
    else shouldActivate = !isCurrentlyActive;

    if (shouldActivate) {
      const activeCorridor: EmergencyCorridor = {
        ...createEmergencyRun(),
        vehicleId,
      };

      simState.emergencyCorridor = activeCorridor;
      simState.simulationMode = 'emergency';
      simState.intersections = applyEmergencyPriority(simState.intersections, activeCorridor);

      await this.repo.createEmergencyEvent({
        vehicleId,
        vehicleType: 'ambulance',
        origin: activeCorridor.origin,
        destination: activeCorridor.destination,
        status: 'en_route',
        routeIntersectionIds: activeCorridor.routeIntersectionIds,
        normalEtaSeconds: activeCorridor.normalEtaSeconds,
        niuEtaSeconds: activeCorridor.niuEtaSeconds,
        timeSavedSeconds: activeCorridor.timeSavedSeconds,
      });

      return {
        corridor: activeCorridor,
        intersections: simState.intersections,
        eventLogged: true,
      };
    } else {
      // Cancel emergency run
      const resetCorridor = { ...DEFAULT_EMERGENCY_CORRIDOR };
      simState.emergencyCorridor = resetCorridor;
      simState.simulationMode = simState.isRushHour ? 'rush_hour' : 'normal';
      simState.intersections = applyEmergencyPriority(simState.intersections, resetCorridor);

      return {
        corridor: resetCorridor,
        intersections: simState.intersections,
        eventLogged: false,
      };
    }
  }
}

export const emergencyService = new EmergencyService();
