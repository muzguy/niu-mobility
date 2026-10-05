import { getRepository } from '@/lib/repositories';
import { optimizeSignalTiming } from '@/lib/traffic/signal-optimizer';
import { aggregateCityMetrics } from '@/lib/traffic/traffic-engine';
import {
  createInitialSimulationState,
  setSimulationTrafficMode,
  SimulationTrafficMode,
} from '@/lib/simulation/simulation-engine';
import { OptimizationInput, OptimizationResult, Intersection } from '@/types/traffic';
import { CityMobilityMetrics } from '@/types/mobility';

// Global state container for backend simulation transitions
declare global {
  var __niu_backend_simulation_state: ReturnType<typeof createInitialSimulationState> | undefined;
}

function getBackendSimulationState() {
  if (!globalThis.__niu_backend_simulation_state) {
    globalThis.__niu_backend_simulation_state = createInitialSimulationState();
  }
  return globalThis.__niu_backend_simulation_state;
}

export class TrafficService {
  private repo = getRepository();

  public async getTrafficState(): Promise<{
    simulationMode: SimulationTrafficMode;
    metrics: CityMobilityMetrics;
    intersections: Intersection[];
    activeCorridor: string;
    totalVehiclesApproaching: number;
    averageQueueMeters: number;
    averageWaitMinutes: number;
    timestamp: string;
  }> {
    const simState = getBackendSimulationState();
    const intersections = await this.repo.getIntersections();

    const totalVehiclesApproaching = intersections.reduce((sum, item) => sum + item.vehicleCount, 0);
    const averageQueueMeters = Math.round(
      intersections.reduce((sum, item) => sum + item.queueLengthMeters, 0) / (intersections.length || 1)
    );
    const averageWaitMinutes = Number(
      (
        intersections.reduce((sum, item) => sum + item.waitingTimeMinutes, 0) / (intersections.length || 1)
      ).toFixed(1)
    );

    return {
      simulationMode: simState.simulationMode,
      metrics: simState.metrics,
      intersections,
      activeCorridor: 'Alpha 1 ➔ Pari Chowk ➔ Knowledge Park',
      totalVehiclesApproaching,
      averageQueueMeters,
      averageWaitMinutes,
      timestamp: new Date().toISOString(),
    };
  }

  public async getIntersections(): Promise<Intersection[]> {
    return this.repo.getIntersections();
  }

  public async getIntersectionById(id: string): Promise<Intersection | null> {
    return this.repo.getIntersectionById(id);
  }

  public async optimizeIntersectionSignal(input: OptimizationInput): Promise<OptimizationResult> {
    // 1. Execute deterministic Webster algorithm
    const result = optimizeSignalTiming(input);

    // 2. Persist signal timing to repository
    await this.repo.saveSignalTiming({
      intersectionId: result.intersectionId,
      cycleLength: 120,
      timings: result.recommendedTiming,
      optimizationMethod: 'webster_minimum_delay',
      waitingTimeReductionPct: result.waitingTimeReductionPct,
      queueReductionPct: result.queueReductionPct,
      estimatedCo2SavedKg: result.estimatedCo2SavedKg,
      timestamp: new Date().toISOString(),
    });

    // 3. Update active backend simulation state
    const simState = getBackendSimulationState();
    const target = simState.intersections.find((item) => item.id === input.intersectionId);
    if (target) {
      target.signalTiming = { ...result.recommendedTiming };
      target.waitingTimeMinutes = Math.max(
        0.5,
        Number((target.waitingTimeMinutes * (1 - result.waitingTimeReductionPct / 100)).toFixed(1))
      );
      target.queueLengthMeters = Math.max(
        5,
        Math.round(target.queueLengthMeters * (1 - result.queueReductionPct / 100))
      );
      simState.metrics = aggregateCityMetrics(simState.intersections);
    }

    return result;
  }

  public async setScenarioMode(mode: SimulationTrafficMode): Promise<{
    mode: SimulationTrafficMode;
    metrics: CityMobilityMetrics;
    intersections: Intersection[];
  }> {
    const currentState = getBackendSimulationState();
    const nextState = setSimulationTrafficMode(currentState, mode);
    globalThis.__niu_backend_simulation_state = nextState;

    // Log simulation scenario transition to repository
    await this.repo.logSimulationRun({
      mode,
      triggeredBy: 'api_traffic_simulation',
      startedAt: new Date().toISOString(),
      metadata: {
        totalIntersections: nextState.intersections.length,
        avgSpeed: nextState.metrics.averageSpeedKmH,
        loadPct: nextState.metrics.trafficLoadPct,
      },
    });

    return {
      mode: nextState.simulationMode,
      metrics: nextState.metrics,
      intersections: nextState.intersections,
    };
  }
}

export const trafficService = new TrafficService();
