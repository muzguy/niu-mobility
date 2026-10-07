import { ApiResponse } from './api-response';
import { OptimizationInput, OptimizationResult, Intersection } from '@/types/traffic';
import { SimulationTrafficMode } from './simulation/simulation-engine';
import { RideMatchResult, RideSearchQuery } from '@/types/carpool';
import { SustainabilityScore } from '@/types/impact';
import { CityMobilityMetrics } from '@/types/mobility';

/**
 * Robust fetch wrapper with timeout and error handling
 */
async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    const data = (await res.json()) as ApiResponse<T>;
    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : 'Network request failed';
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Health check
 */
export async function apiCheckHealth() {
  return fetchApi<{
    service: string;
    status: string;
    version: string;
    dataMode: string;
    databaseConfigured: boolean;
  }>('/api/health');
}

/**
 * Traffic state
 */
export async function apiGetTrafficState(zoneId?: string) {
  const url = zoneId ? `/api/traffic?zoneId=${encodeURIComponent(zoneId)}` : '/api/traffic';
  return fetchApi<{
    simulationMode: SimulationTrafficMode;
    metrics: CityMobilityMetrics;
    intersections: Intersection[];
    activeCorridor: string;
    totalVehiclesApproaching: number;
    averageQueueMeters: number;
    averageWaitMinutes: number;
    timestamp: string;
    zoneId?: string;
    zoneName?: string;
    dataAvailability?: import('@/types/geospatial').DataAvailability;
    provenance?: import('@/types/geospatial').DataProvenance;
  }>(url);
}

/**
 * Monitored intersections
 */
export async function apiGetIntersections() {
  return fetchApi<{
    total: number;
    intersections: Intersection[];
  }>('/api/traffic/intersections');
}

/**
 * Run Webster signal optimization via API
 */
export async function apiOptimizeSignal(input: OptimizationInput) {
  return fetchApi<OptimizationResult>('/api/traffic/optimize', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Set simulation scenario mode via API
 */
export async function apiSetSimulationScenario(mode: SimulationTrafficMode) {
  return fetchApi<{
    mode: SimulationTrafficMode;
    metrics: CityMobilityMetrics;
    intersections: Intersection[];
  }>('/api/traffic/simulation', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

/**
 * Search carpool rides via API
 */
export async function apiSearchCarpool(query: RideSearchQuery) {
  return fetchApi<{
    matches: RideMatchResult[];
    totalMatches: number;
    potentialCo2DividendKg: number;
    searchQuery: RideSearchQuery;
  }>('/api/carpool/search', {
    method: 'POST',
    body: JSON.stringify(query),
  });
}

/**
 * Calculate routes via API
 */
export async function apiGetRoutes(
  origin: string,
  destination: string,
  options?: {
    zoneId?: string;
    objective?: string;
    scenario?: string;
    vehicleType?: string;
  }
) {
  return fetchApi<import('@/types/routing').SmartRouteComparisonResult>('/api/routes', {
    method: 'POST',
    body: JSON.stringify({
      origin,
      destination,
      zoneId: options?.zoneId,
      objective: options?.objective,
      scenario: options?.scenario,
      vehicleType: options?.vehicleType,
    }),
  });
}

/**
 * Fetch impact metrics via API
 */
export async function apiGetImpact() {
  return fetchApi<{
    metrics: {
      estimatedCo2SavedTons: number;
      fuelSavedLiters: number;
      tripsAvoided: number;
      commuteHoursSaved: number;
      sustainabilityIndex: number;
    };
    sustainabilityScore: SustainabilityScore;
    weeklyImpactData: Array<{
      day: string;
      carpoolKg: number;
      signalOptKg: number;
      ecoRouteKg: number;
      totalSavedKg: number;
    }>;
  }>('/api/impact');
}

/**
 * Emergency priority pre-emption via API
 */
export async function apiTriggerEmergency(action: 'activate' | 'cancel' | 'toggle', vehicleId = 'AMB-108') {
  return fetchApi<{
    corridor: unknown;
    intersections: Intersection[];
    eventLogged: boolean;
  }>('/api/emergency/priority', {
    method: 'POST',
    body: JSON.stringify({ action, vehicleId }),
  });
}

/**
 * Location search via OpenStreetMap API
 */
export async function apiSearchLocations(query: string, limit = 5) {
  return fetchApi<{
    query: string;
    count: number;
    results: import('@/types/geospatial').LocationSearchResult[];
  }>(`/api/location/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

/**
 * List registered Mobility Zones
 */
export async function apiGetMobilityZones() {
  return fetchApi<{
    count: number;
    zones: import('@/types/geospatial').MobilityZone[];
  }>('/api/location/zone');
}

/**
 * Get single Mobility Zone details
 */
export async function apiGetMobilityZone(id: string) {
  return fetchApi<import('@/types/geospatial').MobilityZone>(`/api/location/zone/${encodeURIComponent(id)}`);
}

/**
 * Get Zone-specific location-aware traffic state
 */
export async function apiGetZoneTraffic(zoneId: string, options?: { hour?: number; scenario?: string }) {
  const query = new URLSearchParams();
  if (options?.hour !== undefined) query.set('hour', options.hour.toString());
  if (options?.scenario) query.set('scenario', options.scenario);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return fetchApi<import('@/types/geospatial').ZoneTrafficTelemetry>(
    `/api/location/zone/${encodeURIComponent(zoneId)}/traffic${qStr}`
  );
}

/**
 * Get Map-ready GeoJSON and telemetry payload for a Mobility Zone
 */
export async function apiGetZoneMapPayload(zoneId: string, scenario?: string, minutesAhead?: number) {
  const params = new URLSearchParams();
  if (scenario) params.set('scenario', scenario);
  if (minutesAhead !== undefined && minutesAhead > 0) params.set('minutesAhead', minutesAhead.toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<import('@/types/map').ZoneMapPayload>(
    `/api/location/zone/${encodeURIComponent(zoneId)}/map${query}`
  );
}


/**
 * Get deterministic multi-horizon traffic predictions and recommendations
 */
export async function apiGetTrafficPrediction(params?: {
  zoneId?: string;
  horizon?: string;
  scenario?: string;
  hour?: number;
}) {
  const query = new URLSearchParams();
  if (params?.zoneId) query.set('zoneId', params.zoneId);
  if (params?.horizon) query.set('horizon', params.horizon);
  if (params?.scenario) query.set('scenario', params.scenario);
  if (params?.hour !== undefined) query.set('hour', params.hour.toString());

  const qStr = query.toString() ? `?${query.toString()}` : '';
  return fetchApi<import('@/types/prediction').TrafficPredictionResult>(
    `/api/traffic/prediction${qStr}`
  );
}

/**
 * Simulate What-If Mobility Incident scenario
 */
export async function apiSimulateIncident(params: {
  zoneId?: string;
  type: import('@/types/incident').IncidentType;
  intersectionId: string;
  severity: import('@/types/incident').IncidentSeverity;
  durationMinutes: import('@/types/incident').IncidentDurationMinutes;
  baseHour?: number;
  scenario?: string;
}) {
  return fetchApi<import('@/types/incident').IncidentSimulationResult>(
    '/api/traffic/incident/simulate',
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
}




