import { Coordinate } from './geospatial';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

export type RouteType =
  | 'fastest'
  | 'balanced'
  | 'greenest'
  | 'shortest'
  | 'lowest_congestion'
  | 'optimal';

export type RoutingObjective =
  | 'NIU_OPTIMAL'
  | 'FASTEST'
  | 'SHORTEST'
  | 'LOWEST_EMISSIONS'
  | 'LOWEST_CONGESTION';

export interface RoadGraphNode {
  id: string;
  name: string;
  coordinate: Coordinate;
  connectedEdgeIds: string[];
  isSignalized: boolean;
  intersectionDelaySeconds: number;
}

export interface RoadGraphEdge {
  id: string;
  roadId: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  coordinates: Coordinate[];
  lengthMeters: number;
  highwayType: string;
  lanes: number;
  maxSpeedKph: number;
  freeFlowSpeedKph: number;
  currentSpeedKph: number;
  volumeVehPerHour: number;
  capacityVehPerHour: number;
  vcRatio: number;
  trafficState: 'low' | 'moderate' | 'severe';
  oneWay: boolean;
  estimatedDelaySeconds: number;
  estimatedEmissionsKg: number;
}

export interface RoadGraph {
  zoneId: string;
  nodes: Map<string, RoadGraphNode>;
  edges: Map<string, RoadGraphEdge>;
  adjacency: Map<string, string[]>; // nodeId -> array of edgeIds originating from this node
  builtAt: string;
  scenario: SimulationTrafficMode;
}

export interface LocationSnapResult {
  requestedCoordinate: Coordinate;
  snappedCoordinate: Coordinate;
  nearestNodeId: string;
  snappedNodeName: string;
  roadId?: string;
  distanceMeters: number;
}

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

  // Optional Phase 9 fields for backward-compatible consumption
  routeId?: string;
  objective?: RoutingObjective;
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][]; // [longitude, latitude]
  };
  distanceMeters?: number;
  durationSeconds?: number;
  durationMinutes?: number;
  emissionsKg?: number;
  congestionScore?: number;
  intersectionDelaySeconds?: number;
  roadCount?: number;
  niuScore?: number;
  recommendationReason?: string;
  scoreBreakdown?: {
    timeScore: number;
    congestionScore: number;
    emissionsScore: number;
    delayScore: number;
  };
}

export interface SmartRouteAlternative extends RouteOption {
  routeId: string;
  objective: RoutingObjective;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [longitude, latitude]
  };
  distanceMeters: number;
  durationSeconds: number;
  durationMinutes: number;
  emissionsKg: number;
  congestionScore: number; // 0 - 100
  intersectionDelaySeconds: number;
  roadCount: number;
  niuScore: number; // 0 - 100 (normalized multi-criteria index)
  recommendationReason: string;
  scoreBreakdown: {
    timeScore: number;
    congestionScore: number;
    emissionsScore: number;
    delayScore: number;
  };
}

export interface RouteRequest {
  origin: string;
  destination: string;
  zoneId?: string;
  objective?: RoutingObjective;
  scenario?: SimulationTrafficMode;
  vehicleType?: 'petrol' | 'diesel' | 'hybrid' | 'ev';
}

export interface SmartRouteComparisonResult {
  zoneId: string;
  origin: {
    query: string;
    resolvedName: string;
    coordinate: Coordinate;
    snappedCoordinate: Coordinate;
    snapDistanceMeters: number;
  };
  destination: {
    query: string;
    resolvedName: string;
    coordinate: Coordinate;
    snappedCoordinate: Coordinate;
    snapDistanceMeters: number;
  };
  scenario: SimulationTrafficMode;
  objective: RoutingObjective;
  routes: SmartRouteAlternative[];
  recommendedRoute: SmartRouteAlternative | null;
  recommendedRouteId: string;
  provenance: {
    roadNetwork: 'REAL — OSM' | 'REAL — SEED_CALIBRATED' | 'SYNTHETIC_FALLBACK';
    traffic: 'SIMULATED — NIU SYNTHETIC DEMAND ENGINE';
    route: 'NIU COMPUTED';
    emissions: 'ESTIMATED — IPCC/CEA CALIBRATED';
  };
  timestamp: string;
}

export interface IRouteProvider {
  getRoutes(request: RouteRequest): Promise<RouteOption[]>;
}
