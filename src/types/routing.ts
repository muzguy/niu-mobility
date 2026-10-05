export type RouteType = 'fastest' | 'balanced' | 'greenest';

export interface RouteOption {
  id: string;
  type: RouteType;
  title: string;
  badge: string;
  tagline: string;
  etaMinutes: number;
  distanceKm: number;
  trafficLevel: 'Low' | 'Medium' | 'High';
  congestionIndex: number; // 0 - 100
  estimatedCo2Kg: number;
  fuelConsumedLiters: number;
  idleDelayMinutes: number;
  averageSpeedKmH: number;
  keyCorridors: string[];
  pathDescription: string;
  isRecommended: boolean;
  colorHex: string;
}

export interface RouteRequest {
  origin: string;
  destination: string;
  vehicleType?: 'petrol' | 'diesel' | 'hybrid' | 'ev';
}

export interface IRouteProvider {
  getRoutes(request: RouteRequest): Promise<RouteOption[]>;
}
