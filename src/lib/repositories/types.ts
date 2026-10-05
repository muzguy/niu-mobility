import { Intersection, Direction } from '@/types/traffic';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

export interface TrafficSnapshotRecord {
  id: string;
  intersectionId: string;
  timestamp: string;
  vehicleCount: number;
  averageSpeed: number;
  queueLength: number;
  averageWait: number;
  congestionLevel: string;
  simulationMode: string;
}

export interface SignalTimingRecord {
  id?: string;
  intersectionId: string;
  cycleLength: number;
  timings: Record<Direction, number>;
  timestamp?: string;
  optimizationMethod: string;
  waitingTimeReductionPct?: number;
  queueReductionPct?: number;
  estimatedCo2SavedKg?: number;
}

export interface EmergencyEventRecord {
  id?: string;
  vehicleId: string;
  vehicleType: string;
  origin: string;
  destination: string;
  status: 'idle' | 'en_route' | 'completed' | 'cancelled';
  routeIntersectionIds: string[];
  normalEtaSeconds: number;
  niuEtaSeconds: number;
  timeSavedSeconds: number;
  startedAt?: string;
  completedAt?: string;
}

export interface CarpoolRequestRecord {
  id?: string;
  userIdentifier: string;
  origin: string;
  destination: string;
  departureTime: string;
  seatsRequired: number;
  status?: string;
}

export interface RouteQueryRecord {
  id?: string;
  origin: string;
  destination: string;
  selectedRoute?: string;
  distanceKm: number;
  durationMinutes: number;
  co2Kg: number;
  fuelLiters: number;
}

export interface ImpactMetricsRecord {
  vehiclesSaved: number;
  tripsShared: number;
  co2SavedTons: number;
  fuelSavedLiters: number;
  timeSavedHours: number;
  sustainabilityIndex: number;
  timestamp: string;
}

export interface SimulationRunRecord {
  id?: string;
  mode: SimulationTrafficMode;
  triggeredBy: string;
  startedAt: string;
  metadata?: Record<string, unknown>;
}

import { MobilityZone, GeoRoadSegment, MobilityIntersection } from '@/types/geospatial';

/**
 * IMobilityRepository
 * Common contract for data access across Simulation Mode and Supabase/PostgreSQL Mode
 */
export interface IMobilityRepository {
  getIntersections(): Promise<Intersection[]>;
  getIntersectionById(id: string): Promise<Intersection | null>;
  getTrafficSnapshots(): Promise<TrafficSnapshotRecord[]>;
  saveTrafficSnapshot(snapshot: Omit<TrafficSnapshotRecord, 'id'>): Promise<TrafficSnapshotRecord>;
  getSignalTimings(intersectionId: string): Promise<Record<Direction, number> | null>;
  saveSignalTiming(record: SignalTimingRecord): Promise<void>;
  createEmergencyEvent(event: EmergencyEventRecord): Promise<EmergencyEventRecord>;
  getImpactMetrics(): Promise<ImpactMetricsRecord>;
  logRouteQuery(query: RouteQueryRecord): Promise<void>;
  saveCarpoolRequest(req: CarpoolRequestRecord): Promise<void>;
  logSimulationRun(run: SimulationRunRecord): Promise<void>;

  // Geospatial & Mobility Zone Persistence
  saveMobilityZone(zone: MobilityZone): Promise<void>;
  getMobilityZone(id: string): Promise<MobilityZone | null>;
  listMobilityZones(): Promise<MobilityZone[]>;
  saveRoadNetwork(
    zoneId: string,
    network: { roads: GeoRoadSegment[]; intersections: MobilityIntersection[] }
  ): Promise<void>;
  getRoadNetwork(
    zoneId: string
  ): Promise<{ roads: GeoRoadSegment[]; intersections: MobilityIntersection[] } | null>;
}

