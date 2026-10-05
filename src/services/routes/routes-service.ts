import { smartRoutingEngine } from '@/lib/routing/smart-routing-engine';
import { getRepository } from '@/lib/repositories';
import {
  RouteOption,
  RoutingObjective,
  SmartRouteComparisonResult,
} from '@/types/routing';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

export interface RouteComparisonOptions {
  zoneId?: string;
  objective?: RoutingObjective;
  scenario?: SimulationTrafficMode;
  vehicleType?: 'petrol' | 'diesel' | 'hybrid' | 'ev';
}

export class RoutesService {
  private repo = getRepository();

  /**
   * Phase 9 Smart Traffic-Aware Route Comparison
   */
  public async getSmartRouteComparison(
    origin: string,
    destination: string,
    options: RouteComparisonOptions = {}
  ): Promise<SmartRouteComparisonResult> {
    const comparison = await smartRoutingEngine.calculateRoutes({
      origin,
      destination,
      zoneId: options.zoneId,
      objective: options.objective,
      scenario: options.scenario,
      vehicleType: options.vehicleType,
    });

    // Log query to repository
    if (comparison.recommendedRoute) {
      await this.repo.logRouteQuery({
        origin: comparison.origin.resolvedName,
        destination: comparison.destination.resolvedName,
        selectedRoute: comparison.recommendedRoute.type,
        distanceKm: comparison.recommendedRoute.distanceKm,
        durationMinutes: comparison.recommendedRoute.etaMinutes,
        co2Kg: comparison.recommendedRoute.estimatedCo2Kg,
        fuelLiters: comparison.recommendedRoute.fuelConsumedLiters,
      });
    }

    return comparison;
  }

  /**
   * Backward-compatible legacy Route Comparison method
   */
  public async getRouteComparison(
    origin: string,
    destination: string,
    options: RouteComparisonOptions = {}
  ): Promise<{
    origin: string;
    destination: string;
    routes: RouteOption[];
    recommendedRoute: RouteOption | null;
    timestamp: string;
    smartComparison?: SmartRouteComparisonResult;
  }> {
    try {
      const smartResult = await this.getSmartRouteComparison(origin, destination, options);
      return {
        origin,
        destination,
        routes: smartResult.routes,
        recommendedRoute: smartResult.recommendedRoute,
        timestamp: smartResult.timestamp,
        smartComparison: smartResult,
      };
    } catch {
      // Fallback
      const routes = await smartRoutingEngine.getRoutes({
        origin,
        destination,
        zoneId: options.zoneId,
        objective: options.objective,
        scenario: options.scenario,
        vehicleType: options.vehicleType,
      });
      const recommendedRoute = routes.find((r) => r.isRecommended) || routes[0] || null;

      if (recommendedRoute) {
        await this.repo.logRouteQuery({
          origin,
          destination,
          selectedRoute: recommendedRoute.type,
          distanceKm: recommendedRoute.distanceKm,
          durationMinutes: recommendedRoute.etaMinutes,
          co2Kg: recommendedRoute.estimatedCo2Kg,
          fuelLiters: recommendedRoute.fuelConsumedLiters,
        });
      }

      return {
        origin,
        destination,
        routes,
        recommendedRoute,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const routesService = new RoutesService();
