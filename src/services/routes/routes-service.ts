import { getRoutes } from '@/lib/routing/routing-engine';
import { getRepository } from '@/lib/repositories';
import { RouteOption } from '@/types/routing';

export class RoutesService {
  private repo = getRepository();

  public async getRouteComparison(
    origin: string,
    destination: string
  ): Promise<{
    origin: string;
    destination: string;
    routes: RouteOption[];
    recommendedRoute: RouteOption | null;
    timestamp: string;
  }> {
    // 1. Calculate routes via decoupled routing provider
    const routes = await getRoutes(origin, destination);
    const recommendedRoute = routes.find((r) => r.isRecommended) || routes[0] || null;

    // 2. Log query to repository
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

export const routesService = new RoutesService();
