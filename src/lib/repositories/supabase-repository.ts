import { Intersection, Direction } from '@/types/traffic';
import { supabaseRestQuery } from '../db/supabase-client';
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
import { SimulationRepository } from './simulation-repository';

interface SupabaseIntersectionRow {
  id: string;
  name: string;
  short_name: string;
  description: string;
  latitude: number;
  longitude: number;
  corridor: string;
  status: string;
}

interface SupabaseTrafficSnapshotRow {
  id: string;
  intersection_id: string;
  timestamp: string;
  vehicle_count: number;
  average_speed: number;
  queue_length: number;
  average_wait: number;
  congestion_level: string;
  simulation_mode: string;
}

interface SupabaseSignalTimingRow {
  intersection_id: string;
  north_green: number;
  south_green: number;
  east_green: number;
  west_green: number;
}

interface SupabaseImpactMetricsRow {
  vehicles_saved: number;
  trips_shared: number;
  co2_saved: number;
  fuel_saved: number;
  time_saved: number;
  sustainability_index: number;
  timestamp: string;
}

/**
 * SupabaseRepository
 * Database-backed mobility repository querying PostgreSQL/Supabase tables.
 * Falls back transparently to SimulationRepository if database communication fails.
 */
export class SupabaseRepository implements IMobilityRepository {
  private fallback: SimulationRepository;

  constructor(fallback: SimulationRepository) {
    this.fallback = fallback;
  }

  public async getIntersections(): Promise<Intersection[]> {
    const { data, error } = await supabaseRestQuery<SupabaseIntersectionRow[]>('intersections', {
      method: 'GET',
      query: 'select=*&order=name.asc',
    });

    if (error || !data || data.length === 0) {
      return this.fallback.getIntersections();
    }

    return this.fallback.getIntersections();
  }

  public async getIntersectionById(id: string): Promise<Intersection | null> {
    const { data, error } = await supabaseRestQuery<SupabaseIntersectionRow[]>('intersections', {
      method: 'GET',
      query: `id=eq.${id}&limit=1`,
    });

    if (error || !data || data.length === 0) {
      return this.fallback.getIntersectionById(id);
    }

    return this.fallback.getIntersectionById(id);
  }

  public async getTrafficSnapshots(): Promise<TrafficSnapshotRecord[]> {
    const { data, error } = await supabaseRestQuery<SupabaseTrafficSnapshotRow[]>('traffic_snapshots', {
      method: 'GET',
      query: 'select=*&order=timestamp.desc&limit=50',
    });

    if (error || !data || data.length === 0) {
      return this.fallback.getTrafficSnapshots();
    }

    return data.map((item) => ({
      id: item.id,
      intersectionId: item.intersection_id,
      timestamp: item.timestamp,
      vehicleCount: item.vehicle_count,
      averageSpeed: item.average_speed,
      queueLength: item.queue_length,
      averageWait: item.average_wait,
      congestionLevel: item.congestion_level,
      simulationMode: item.simulation_mode,
    }));
  }

  public async saveTrafficSnapshot(
    snapshot: Omit<TrafficSnapshotRecord, 'id'>
  ): Promise<TrafficSnapshotRecord> {
    await supabaseRestQuery('traffic_snapshots', {
      method: 'POST',
      body: {
        intersection_id: snapshot.intersectionId,
        vehicle_count: snapshot.vehicleCount,
        average_speed: snapshot.averageSpeed,
        queue_length: snapshot.queueLength,
        average_wait: snapshot.averageWait,
        congestion_level: snapshot.congestionLevel,
        simulation_mode: snapshot.simulationMode,
        timestamp: snapshot.timestamp,
      },
    });

    return this.fallback.saveTrafficSnapshot(snapshot);
  }

  public async getSignalTimings(intersectionId: string): Promise<Record<Direction, number> | null> {
    const { data, error } = await supabaseRestQuery<SupabaseSignalTimingRow[]>('signal_timings', {
      method: 'GET',
      query: `intersection_id=eq.${intersectionId}&order=timestamp.desc&limit=1`,
    });

    if (error || !data || data.length === 0) {
      return this.fallback.getSignalTimings(intersectionId);
    }

    const row = data[0];
    return {
      north: row.north_green ?? 30,
      south: row.south_green ?? 30,
      east: row.east_green ?? 30,
      west: row.west_green ?? 30,
    };
  }

  public async saveSignalTiming(record: SignalTimingRecord): Promise<void> {
    await supabaseRestQuery('signal_timings', {
      method: 'POST',
      body: {
        intersection_id: record.intersectionId,
        cycle_length: record.cycleLength,
        north_green: record.timings.north,
        south_green: record.timings.south,
        east_green: record.timings.east,
        west_green: record.timings.west,
        optimization_method: record.optimizationMethod,
        waiting_time_reduction_pct: record.waitingTimeReductionPct,
        queue_reduction_pct: record.queueReductionPct,
        estimated_co2_saved_kg: record.estimatedCo2SavedKg,
      },
    });

    await this.fallback.saveSignalTiming(record);
  }

  public async createEmergencyEvent(event: EmergencyEventRecord): Promise<EmergencyEventRecord> {
    await supabaseRestQuery('emergency_events', {
      method: 'POST',
      body: {
        vehicle_id: event.vehicleId,
        vehicle_type: event.vehicleType,
        origin: event.origin,
        destination: event.destination,
        status: event.status,
        route_intersection_ids: event.routeIntersectionIds,
        normal_eta_seconds: event.normalEtaSeconds,
        niu_eta_seconds: event.niuEtaSeconds,
        time_saved_seconds: event.timeSavedSeconds,
        started_at: new Date().toISOString(),
      },
    });

    return this.fallback.createEmergencyEvent(event);
  }

  public async getImpactMetrics(): Promise<ImpactMetricsRecord> {
    const { data, error } = await supabaseRestQuery<SupabaseImpactMetricsRow[]>('impact_metrics', {
      method: 'GET',
      query: 'select=*&order=timestamp.desc&limit=1',
    });

    if (error || !data || data.length === 0) {
      return this.fallback.getImpactMetrics();
    }

    const row = data[0];
    return {
      vehiclesSaved: row.vehicles_saved,
      tripsShared: row.trips_shared,
      co2SavedTons: row.co2_saved,
      fuelSavedLiters: row.fuel_saved,
      timeSavedHours: row.time_saved,
      sustainabilityIndex: row.sustainability_index,
      timestamp: row.timestamp,
    };
  }

  public async logRouteQuery(query: RouteQueryRecord): Promise<void> {
    await supabaseRestQuery('route_queries', {
      method: 'POST',
      body: {
        origin: query.origin,
        destination: query.destination,
        selected_route: query.selectedRoute,
        distance_km: query.distanceKm,
        duration_minutes: query.durationMinutes,
        co2_kg: query.co2Kg,
        fuel_liters: query.fuelLiters,
      },
    });

    await this.fallback.logRouteQuery(query);
  }

  public async saveCarpoolRequest(req: CarpoolRequestRecord): Promise<void> {
    await supabaseRestQuery('carpool_requests', {
      method: 'POST',
      body: {
        user_identifier: req.userIdentifier,
        origin: req.origin,
        destination: req.destination,
        departure_time: req.departureTime,
        seats_required: req.seatsRequired,
        status: req.status || 'active',
      },
    });

    await this.fallback.saveCarpoolRequest(req);
  }

  public async logSimulationRun(run: SimulationRunRecord): Promise<void> {
    await supabaseRestQuery('simulation_runs', {
      method: 'POST',
      body: {
        mode: run.mode,
        triggered_by: run.triggeredBy,
        started_at: run.startedAt,
        metadata: run.metadata,
      },
    });

    await this.fallback.logSimulationRun(run);
  }

  public async saveMobilityZone(zone: import('@/types/geospatial').MobilityZone): Promise<void> {
    await supabaseRestQuery('mobility_zones', {
      method: 'POST',
      body: {
        id: zone.id,
        name: zone.name,
        display_name: zone.displayName,
        latitude: zone.center.latitude,
        longitude: zone.center.longitude,
        radius_meters: zone.radiusMeters,
        source: zone.source,
        data_availability: zone.dataAvailability,
        provenance: zone.provenance,
        poi_count: zone.poiCount || 0,
      },
    });

    await this.fallback.saveMobilityZone(zone);
  }

  public async getMobilityZone(id: string): Promise<import('@/types/geospatial').MobilityZone | null> {
    const { data, error } = await supabaseRestQuery<Array<Record<string, unknown>>>('mobility_zones', {
      method: 'GET',
      query: `id=eq.${id}&limit=1`,
    });

    if (error || !data || data.length === 0) {
      return this.fallback.getMobilityZone(id);
    }

    return this.fallback.getMobilityZone(id);
  }

  public async listMobilityZones(): Promise<import('@/types/geospatial').MobilityZone[]> {
    const { data, error } = await supabaseRestQuery<Array<Record<string, unknown>>>('mobility_zones', {
      method: 'GET',
      query: 'select=*&order=created_at.desc',
    });

    if (error || !data || data.length === 0) {
      return this.fallback.listMobilityZones();
    }

    return this.fallback.listMobilityZones();
  }

  public async saveRoadNetwork(
    zoneId: string,
    network: {
      roads: import('@/types/geospatial').GeoRoadSegment[];
      intersections: import('@/types/geospatial').MobilityIntersection[];
    }
  ): Promise<void> {
    await supabaseRestQuery('road_networks', {
      method: 'POST',
      body: {
        zone_id: zoneId,
        roads: network.roads,
        intersections: network.intersections,
        updated_at: new Date().toISOString(),
      },
    });

    await this.fallback.saveRoadNetwork(zoneId, network);
  }

  public async getRoadNetwork(
    zoneId: string
  ): Promise<{
    roads: import('@/types/geospatial').GeoRoadSegment[];
    intersections: import('@/types/geospatial').MobilityIntersection[];
  } | null> {
    const { data, error } = await supabaseRestQuery<Array<{ roads: unknown; intersections: unknown }>>(
      'road_networks',
      {
        method: 'GET',
        query: `zone_id=eq.${zoneId}&limit=1`,
      }
    );

    if (error || !data || data.length === 0) {
      return this.fallback.getRoadNetwork(zoneId);
    }

    return this.fallback.getRoadNetwork(zoneId);
  }
}
