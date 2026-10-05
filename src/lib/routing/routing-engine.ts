import { SIMULATED_ROUTE_PAIRS } from '@/data/routes';
import { IRouteProvider, RouteOption, RouteRequest } from '@/types/routing';
import { calculateEmissions } from '../emissions/emissions-engine';
import { smartRoutingEngine } from './smart-routing-engine';

/**
 * Simulated Local Route Provider
 * Implements IRouteProvider abstraction contract with Phase 9 Graph Routing and fallback.
 */
export class SimulatedRouteProvider implements IRouteProvider {
  public async getRoutes(request: RouteRequest): Promise<RouteOption[]> {
    const { origin, destination } = request;

    // 1. Try real graph routing first
    try {
      const graphRoutes = await smartRoutingEngine.getRoutes(request);
      if (graphRoutes && graphRoutes.length > 0) {
        return graphRoutes;
      }
    } catch {
      // Graceful fallback to calibrated route table if graph route cannot be found
    }

    // 2. Attempt exact or normalized match in simulated route table
    const pair = SIMULATED_ROUTE_PAIRS.find(
      (p) =>
        p.origin.toLowerCase().includes(origin.toLowerCase()) &&
        p.destination.toLowerCase().includes(destination.toLowerCase())
    );

    if (pair) {
      return pair.options;
    }

    // Dynamic fallback generation based on approximate distance
    const estDistance = 7.5;
    const emissionsFastest = calculateEmissions({
      distanceKm: estDistance,
      vehicleType: 'compact_car',
      fuelType: 'petrol',
      occupancy: 1,
    });

    const emissionsGreenest = calculateEmissions({
      distanceKm: estDistance + 1.2,
      vehicleType: 'compact_car',
      fuelType: 'hybrid',
      occupancy: 1,
    });

    return [
      {
        id: `dyn-${origin}-${destination}-fastest`,
        type: 'fastest',
        title: 'FASTEST CORRIDOR',
        badge: 'Lowest Transit Duration',
        tagline: `Direct arterial from ${origin} to ${destination}`,
        etaMinutes: 28,
        distanceKm: estDistance,
        trafficLevel: 'High',
        congestionIndex: 78,
        estimatedCo2Kg: emissionsFastest.totalCo2Kg,
        fuelConsumedLiters: emissionsFastest.fuelConsumedLiters,
        idleDelayMinutes: 9.5,
        averageSpeedKmH: 16.0,
        keyCorridors: [`${origin} Link`, 'Central Arterial Express', `${destination} Access`],
        pathDescription: 'Shortest radial distance via arterial spine with high stop-and-go delays.',
        isRecommended: false,
        colorHex: '#ef4444',
      },
      {
        id: `dyn-${origin}-${destination}-balanced`,
        type: 'balanced',
        title: 'BALANCED CORRIDOR',
        badge: 'Recommended Commute',
        tagline: 'Via Peripheral Ring Road',
        etaMinutes: 30,
        distanceKm: estDistance + 0.8,
        trafficLevel: 'Medium',
        congestionIndex: 48,
        estimatedCo2Kg: Number((emissionsFastest.totalCo2Kg * 0.78).toFixed(2)),
        fuelConsumedLiters: Number((emissionsFastest.fuelConsumedLiters * 0.78).toFixed(2)),
        idleDelayMinutes: 4.2,
        averageSpeedKmH: 22.0,
        keyCorridors: ['Peripheral Link', `${destination} South Outer`],
        pathDescription: 'Moderate distance avoiding central bottlenecks with steady cruising speeds.',
        isRecommended: true,
        colorHex: '#38bdf8',
      },
      {
        id: `dyn-${origin}-${destination}-greenest`,
        type: 'greenest',
        title: 'GREENEST CORRIDOR',
        badge: 'Minimum CO2 Footprint',
        tagline: 'Eco-Corridor via Green Belt Bypass',
        etaMinutes: 32,
        distanceKm: estDistance + 1.4,
        trafficLevel: 'Low',
        congestionIndex: 26,
        estimatedCo2Kg: emissionsGreenest.totalCo2Kg,
        fuelConsumedLiters: emissionsGreenest.fuelConsumedLiters,
        idleDelayMinutes: 1.8,
        averageSpeedKmH: 29.5,
        keyCorridors: ['Green Belt Arterial', 'Sector Ring', `${destination} Green Access`],
        pathDescription: 'Continuous-velocity greenway with minimal intersection stops and lowest carbon footprint.',
        isRecommended: false,
        colorHex: '#10b981',
      },
    ];
  }
}

/**
 * Future Mapbox Route Provider Skeleton (Phase 9 Integration)
 * Ready for drop-in when Mapbox token is configured.
 */
export class MapboxRouteProvider implements IRouteProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRoutes(_request: RouteRequest): Promise<RouteOption[]> {
    throw new Error('Mapbox API integration scheduled for Phase 9. Please use SimulatedRouteProvider.');
  }
}

// Active routing engine instance using local simulated provider
export const routingEngine: IRouteProvider = new SimulatedRouteProvider();

export async function getRoutes(origin: string, destination: string): Promise<RouteOption[]> {
  return routingEngine.getRoutes({ origin, destination });
}
