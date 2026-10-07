import { Coordinate } from '@/types/geospatial';
import {
  IRouteProvider,
  RouteOption,
  RouteRequest,
  RoutingObjective,
  SmartRouteAlternative,
  SmartRouteComparisonResult,
} from '@/types/routing';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { locationService } from '@/services/location/location-service';
import { buildRoadGraph } from './road-graph';
import { snapCoordinateToGraph, SnappingError } from './location-snapper';
import { computeSmartRoutes } from './astar-router';
import { SEEDED_MOBILITY_ZONES } from '@/data/mobility-zones-seed';
import {
  findDemoRoutes,
  demoRouteToComparisonResult,
  DemoRouteDefinition,
} from './demo-routes-registry';

export interface SmartRouteQueryOptions {
  zoneId?: string;
  origin: string | Coordinate;
  destination: string | Coordinate;
  objective?: RoutingObjective;
  scenario?: SimulationTrafficMode;
  vehicleType?: 'petrol' | 'diesel' | 'hybrid' | 'ev';
}

export class SmartRoutingEngine implements IRouteProvider {
  /**
   * Main Phase 9 Traffic-Aware Smart Routing calculation.
   * Deterministically finds up to 3 routes using real OSM road geometry,
   * snaps to graph nodes, applies dynamic BPR edge weights, and computes normalized NIU scores.
   */
  public async calculateRoutes(
    options: SmartRouteQueryOptions
  ): Promise<SmartRouteComparisonResult> {
    const {
      origin,
      destination,
      zoneId = 'greater-noida-core',
      objective = 'NIU_OPTIMAL',
      scenario = 'normal',
    } = options;

    // 0. Check for curated demo routes matching origin and destination query strings
    if (typeof origin === 'string' && typeof destination === 'string') {
      const demoMatches = findDemoRoutes(origin, destination);
      if (demoMatches.length > 0) {
        return demoRouteToComparisonResult(demoMatches[0], scenario, objective);
      }

      // Check reverse origin/destination direction
      const reverseMatches = findDemoRoutes(destination, origin);
      if (reverseMatches.length > 0) {
        const rev = reverseMatches[0];
        const reversedRoute: DemoRouteDefinition = {
          ...rev,
          id: `${rev.id}-rev`,
          name: `${rev.destination.name} ➔ ${rev.origin.name}`,
          origin: rev.destination,
          destination: rev.origin,
          geometry: {
            type: 'LineString',
            coordinates: [...rev.geometry.coordinates].reverse(),
          },
          alternatives: rev.alternatives.map((alt) => ({
            ...alt,
            id: `${alt.id}-rev`,
            routeId: `${alt.routeId}-rev`,
            geometry: {
              type: 'LineString',
              coordinates: [...alt.geometry.coordinates].reverse(),
            },
          })),
        };
        return demoRouteToComparisonResult(reversedRoute, scenario, objective);
      }
    }

    // 1. Resolve Origin Coordinate & Name
    let originCoord: Coordinate;
    let originName = typeof origin === 'string' ? origin : 'Origin';
    if (typeof origin === 'string') {
      const resolved = await locationService.resolveLocation(origin);
      if (!resolved) {
        throw new Error(`Location not found in this Mobility Zone: "${origin}"`);
      }
      originCoord = { latitude: resolved.latitude, longitude: resolved.longitude };
      originName = resolved.displayName || resolved.name;
    } else {
      originCoord = origin;
    }

    // 2. Resolve Destination Coordinate & Name
    let destCoord: Coordinate;
    let destName = typeof destination === 'string' ? destination : 'Destination';
    if (typeof destination === 'string') {
      const resolved = await locationService.resolveLocation(destination);
      if (!resolved) {
        throw new Error(`Location not found in this Mobility Zone: "${destination}"`);
      }
      destCoord = { latitude: resolved.latitude, longitude: resolved.longitude };
      destName = resolved.displayName || resolved.name;
    } else {
      destCoord = destination;
    }

    // 3. Load Mobility Zone
    let zone = await locationService.getMobilityZone(zoneId);
    if (!zone) {
      zone = SEEDED_MOBILITY_ZONES.find((z) => z.id === zoneId) || SEEDED_MOBILITY_ZONES[0];
    }

    // 4. Build or retrieve cached RoadGraph for this zone and scenario
    const graph = buildRoadGraph(zone, scenario);

    // 5. Deterministically snap origin and destination to nearest usable road nodes
    let snapOrigin;
    let snapDest;
    try {
      snapOrigin = snapCoordinateToGraph(originCoord, graph, 'Origin');
    } catch (err) {
      if (err instanceof SnappingError) throw err;
      throw new Error(`Failed to snap origin: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      snapDest = snapCoordinateToGraph(destCoord, graph, 'Destination');
    } catch (err) {
      if (err instanceof SnappingError) throw err;
      throw new Error(`Failed to snap destination: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 6. Compute diverse A* routes using traffic-aware dynamic edge costs
    const routes: SmartRouteAlternative[] = computeSmartRoutes(
      graph,
      snapOrigin.nearestNodeId,
      snapDest.nearestNodeId,
      objective
    );

    if (routes.length === 0) {
      throw new Error(
        `No traversable route found connecting "${originName}" and "${destName}" on the active road network graph.`
      );
    }

    const recommendedRoute = routes.find((r) => r.isRecommended) || routes[0] || null;

    const provenanceSource =
      zone.source === 'osm'
        ? ('REAL — OSM' as const)
        : ('REAL — SEED_CALIBRATED' as const);

    return {
      zoneId: zone.id,
      origin: {
        query: typeof origin === 'string' ? origin : `${origin.latitude},${origin.longitude}`,
        resolvedName: originName,
        coordinate: originCoord,
        snappedCoordinate: snapOrigin.snappedCoordinate,
        snapDistanceMeters: snapOrigin.distanceMeters,
      },
      destination: {
        query: typeof destination === 'string' ? destination : `${destination.latitude},${destination.longitude}`,
        resolvedName: destName,
        coordinate: destCoord,
        snappedCoordinate: snapDest.snappedCoordinate,
        snapDistanceMeters: snapDest.distanceMeters,
      },
      scenario,
      objective,
      routes,
      recommendedRoute,
      recommendedRouteId: recommendedRoute?.id || routes[0]?.id || '',
      provenance: {
        roadNetwork: provenanceSource,
        traffic: 'SIMULATED — NIU SYNTHETIC DEMAND ENGINE',
        route: 'NIU COMPUTED',
        emissions: 'ESTIMATED — IPCC/CEA CALIBRATED',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * IRouteProvider implementation for backward compatibility
   */
  public async getRoutes(request: RouteRequest): Promise<RouteOption[]> {
    try {
      const result = await this.calculateRoutes({
        origin: request.origin,
        destination: request.destination,
        zoneId: request.zoneId,
        objective: request.objective,
        scenario: request.scenario,
        vehicleType: request.vehicleType,
      });
      return result.routes;
    } catch {
      // Fallback gracefully without fabrication if graph cannot be routed
      return [];
    }
  }
}

export const smartRoutingEngine = new SmartRoutingEngine();
