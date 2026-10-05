import { INITIAL_INTERSECTIONS } from '@/data/intersections';
import { INITIAL_CITY_METRICS } from '@/data/traffic';
import { Intersection, Direction } from '@/types/traffic';
import {
  IMobilityRepository,
  TrafficSnapshotRecord,
  SignalTimingRecord,
  EmergencyEventRecord,
  ImpactMetricsRecord,
  RouteQueryRecord,
  CarpoolRequestRecord,
  SimulationRunRecord,
} from './types';

/**
 * SimulationRepository
 * In-memory deterministic mobility repository for Demo Mode (zero external dependencies).
 */
export class SimulationRepository implements IMobilityRepository {
  private intersections: Intersection[];
  private signalTimings: Map<string, Record<Direction, number>>;
  private snapshots: TrafficSnapshotRecord[];
  private emergencyEvents: EmergencyEventRecord[];
  private routeQueries: RouteQueryRecord[];
  private carpoolRequests: CarpoolRequestRecord[];
  private simulationRuns: SimulationRunRecord[];

  constructor() {
    this.intersections = JSON.parse(JSON.stringify(INITIAL_INTERSECTIONS));
    this.signalTimings = new Map();
    this.intersections.forEach((item) => {
      this.signalTimings.set(item.id, { ...item.signalTiming });
    });

    this.snapshots = this.intersections.map((item) => ({
      id: `snap-${item.id}-${Date.now()}`,
      intersectionId: item.id,
      timestamp: new Date().toISOString(),
      vehicleCount: item.vehicleCount,
      averageSpeed: item.averageSpeedKmH,
      queueLength: item.queueLengthMeters,
      averageWait: item.waitingTimeMinutes,
      congestionLevel: item.congestionLevel,
      simulationMode: 'normal',
    }));

    this.emergencyEvents = [];
    this.routeQueries = [];
    this.carpoolRequests = [];
    this.simulationRuns = [
      {
        id: 'run-init',
        mode: 'normal',
        triggeredBy: 'system_boot',
        startedAt: new Date().toISOString(),
        metadata: { info: 'Deterministic simulation initialized' },
      },
    ];
  }

  public async getIntersections(): Promise<Intersection[]> {
    return [...this.intersections];
  }

  public async getIntersectionById(id: string): Promise<Intersection | null> {
    const found = this.intersections.find((item) => item.id === id);
    return found ? { ...found } : null;
  }

  public async getTrafficSnapshots(): Promise<TrafficSnapshotRecord[]> {
    return [...this.snapshots];
  }

  public async saveTrafficSnapshot(
    snapshot: Omit<TrafficSnapshotRecord, 'id'>
  ): Promise<TrafficSnapshotRecord> {
    const record: TrafficSnapshotRecord = {
      ...snapshot,
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    this.snapshots.unshift(record);
    if (this.snapshots.length > 100) this.snapshots.pop();
    return record;
  }

  public async getSignalTimings(intersectionId: string): Promise<Record<Direction, number> | null> {
    const timings = this.signalTimings.get(intersectionId);
    return timings ? { ...timings } : null;
  }

  public async saveSignalTiming(record: SignalTimingRecord): Promise<void> {
    this.signalTimings.set(record.intersectionId, { ...record.timings });
    const target = this.intersections.find((item) => item.id === record.intersectionId);
    if (target) {
      target.signalTiming = { ...record.timings };
    }
  }

  public async createEmergencyEvent(event: EmergencyEventRecord): Promise<EmergencyEventRecord> {
    const created: EmergencyEventRecord = {
      ...event,
      id: `emg-${Date.now()}`,
      startedAt: new Date().toISOString(),
    };
    this.emergencyEvents.unshift(created);
    return created;
  }

  public async getImpactMetrics(): Promise<ImpactMetricsRecord> {
    return {
      vehiclesSaved: INITIAL_CITY_METRICS.activeTrips,
      tripsShared: 87,
      co2SavedTons: INITIAL_CITY_METRICS.estimatedCo2SavedTons,
      fuelSavedLiters: 788.0,
      timeSavedHours: 48.5,
      sustainabilityIndex: 86.4,
      timestamp: new Date().toISOString(),
    };
  }

  public async logRouteQuery(query: RouteQueryRecord): Promise<void> {
    this.routeQueries.unshift({
      ...query,
      id: `rq-${Date.now()}`,
    });
  }

  public async saveCarpoolRequest(req: CarpoolRequestRecord): Promise<void> {
    this.carpoolRequests.unshift({
      ...req,
      id: req.id || `cp-${Date.now()}`,
      status: req.status || 'active',
    });
  }

  public async logSimulationRun(run: SimulationRunRecord): Promise<void> {
    this.simulationRuns.unshift({
      ...run,
      id: `sim-${Date.now()}`,
    });
  }
}

// Global singleton for server-side persistence during process lifetime
declare global {
  var __niu_simulation_repository: SimulationRepository | undefined;
}

export function getSimulationRepository(): SimulationRepository {
  if (!globalThis.__niu_simulation_repository) {
    globalThis.__niu_simulation_repository = new SimulationRepository();
  }
  return globalThis.__niu_simulation_repository;
}
