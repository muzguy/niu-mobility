import { ApiResponse } from './api-response';
import { OptimizationInput, OptimizationResult, Intersection } from '@/types/traffic';
import { SimulationTrafficMode } from './simulation/simulation-engine';
import { RideMatchResult, RideSearchQuery } from '@/types/carpool';
import { RouteOption } from '@/types/routing';
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
export async function apiGetTrafficState() {
  return fetchApi<{
    simulationMode: SimulationTrafficMode;
    metrics: CityMobilityMetrics;
    intersections: Intersection[];
    activeCorridor: string;
    totalVehiclesApproaching: number;
    averageQueueMeters: number;
    averageWaitMinutes: number;
    timestamp: string;
  }>('/api/traffic');
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
export async function apiGetRoutes(origin: string, destination: string) {
  return fetchApi<{
    origin: string;
    destination: string;
    routes: RouteOption[];
    recommendedRoute: RouteOption | null;
  }>('/api/routes', {
    method: 'POST',
    body: JSON.stringify({ origin, destination }),
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
