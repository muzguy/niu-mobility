import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { SEEDED_MOBILITY_ZONES } from '../src/data/mobility-zones-seed';
import { buildRoadGraph, clearRoadGraphCache } from '../src/lib/routing/road-graph';
import { snapCoordinateToGraph, SnappingError } from '../src/lib/routing/location-snapper';
import { findPathAStar, computeSmartRoutes } from '../src/lib/routing/astar-router';
import { calculateEdgeCost, OBJECTIVE_WEIGHTS } from '../src/lib/routing/routing-cost';
import { smartRoutingEngine } from '../src/lib/routing/smart-routing-engine';
import { routesToGeoJSON } from '../src/lib/map/geojson-converter';
import { routeRequestSchema } from '../src/lib/validations';
import { MobilityZone } from '../src/types/geospatial';

describe('NIU Phase 9 — Traffic-Aware Smart Routing Tests', () => {
  const zone = SEEDED_MOBILITY_ZONES.find((z) => z.id === 'greater-noida-core')!;

  test('1. Graph Construction: Builds nodes and edges from Mobility Zone', () => {
    clearRoadGraphCache();
    const graph = buildRoadGraph(zone, 'normal');

    assert.ok(graph.nodes.size >= 8, 'Graph should contain all registered junctions');
    assert.ok(graph.edges.size >= 15, 'Graph should contain directed edges for road network');
    assert.ok(graph.adjacency.size >= 8, 'Adjacency list should exist for each junction node');

    const pariNode = graph.nodes.get('pari-chowk');
    assert.ok(pariNode, 'Pari Chowk node should exist');
    assert.equal(pariNode.isSignalized, true);
    assert.ok(pariNode.intersectionDelaySeconds > 0, 'Signalized node must have positive delay');
  });

  test('2. One-Way Edge Handling: Respects road directionality', () => {
    clearRoadGraphCache();
    const graph = buildRoadGraph(zone, 'normal');

    // 'rd-galgotias-service-oneway' is declared as oneWay: true
    const oneWayForward = graph.edges.get('edge-rd-galgotias-service-oneway-fwd');
    const oneWayReverse = graph.edges.get('edge-rd-galgotias-service-oneway-rev');

    assert.ok(oneWayForward, 'Forward edge must exist for one-way road');
    assert.equal(oneWayReverse, undefined, 'Reverse edge must NOT exist for one-way road');

    // 'rd-kp-transit' is bidirectional (oneWay: false)
    const biForward = graph.edges.get('edge-rd-kp-transit-fwd');
    const biReverse = graph.edges.get('edge-rd-kp-transit-rev');

    assert.ok(biForward, 'Forward edge must exist for two-way road');
    assert.ok(biReverse, 'Reverse edge must exist for two-way road');
  });

  test('3. Disconnected / Malformed Geometry Handling', () => {
    const malformedZone: MobilityZone = {
      ...zone,
      id: 'test-malformed-zone',
      roads: [
        {
          id: 'bad-road-empty',
          coordinates: [],
          source: 'seed',
        },
        {
          id: 'bad-road-single-point',
          coordinates: [{ latitude: 28.468, longitude: 77.51 }],
          source: 'seed',
        },
        ...zone.roads,
      ],
    };

    const graph = buildRoadGraph(malformedZone, 'normal');
    assert.ok(graph.nodes.size > 0, 'Graph should construct without crashing on malformed roads');
    assert.equal(graph.edges.has('edge-bad-road-empty-fwd'), false);
    assert.equal(graph.edges.has('edge-bad-road-single-point-fwd'), false);
  });

  test('4. Shortest Route: Minimizes pure geographic distance', () => {
    const graph = buildRoadGraph(zone, 'normal');
    const path = findPathAStar(graph, 'alpha-2', 'jagat-farm', 'SHORTEST');

    assert.ok(path, 'Shortest path should be found');
    assert.ok(path.edges.length > 0);

    // Alpha 2 directly connects to Jagat Farm via rd-alpha2-jagat (640m)
    const directEdge = path.edges.find((e) => e.roadId === 'rd-alpha2-jagat');
    assert.ok(directEdge, 'SHORTEST objective should choose direct commercial road link');
  });

  test('5. Fastest Route: Minimizes total travel duration', () => {
    const graph = buildRoadGraph(zone, 'normal');
    const path = findPathAStar(graph, 'pari-chowk', 'knowledge-park', 'FASTEST');

    assert.ok(path, 'Fastest path should be found');
    assert.ok(path.edges.length > 0);
    assert.ok(path.totalCost > 0);
  });

  test('6. Congestion-Aware Route: Weights Volume-to-Capacity ratio', () => {
    const graph = buildRoadGraph(zone, 'rush_hour');
    const weights = OBJECTIVE_WEIGHTS.LOWEST_CONGESTION;

    assert.ok(weights.congestion > weights.time, 'Congestion weight should exceed time weight in LOWEST_CONGESTION');

    const path = findPathAStar(graph, 'pari-chowk', 'knowledge-park', 'LOWEST_CONGESTION');
    assert.ok(path, 'Path under lowest congestion should be found');
  });

  test('7. Emissions-Aware Route: Weights CO2 penalty', () => {
    const weights = OBJECTIVE_WEIGHTS.LOWEST_EMISSIONS;
    assert.ok(weights.emissions >= 1.0, 'Emissions weight must be prioritized in LOWEST_EMISSIONS');

    const edge = zone.roads[0];
    const graph = buildRoadGraph(zone, 'normal');
    const graphEdge = graph.edges.get(`edge-${edge.id}-fwd`)!;
    const toNode = graph.nodes.get(graphEdge.toNodeId)!;

    const costEmissions = calculateEdgeCost(graphEdge, toNode, 'LOWEST_EMISSIONS');
    const costShortest = calculateEdgeCost(graphEdge, toNode, 'SHORTEST');

    assert.ok(typeof costEmissions === 'number' && costEmissions > 0);
    assert.ok(typeof costShortest === 'number' && costShortest > 0);
  });

  test('8. NIU Optimal Scoring: Transparent 0-100 normalization', () => {
    const graph = buildRoadGraph(zone, 'normal');
    const alternatives = computeSmartRoutes(graph, 'pari-chowk', 'knowledge-park', 'NIU_OPTIMAL');

    assert.ok(alternatives.length >= 1, 'Should return at least 1 route');
    const rec = alternatives.find((r) => r.isRecommended);
    assert.ok(rec, 'Must designate one route as isRecommended');

    for (const alt of alternatives) {
      assert.ok(alt.niuScore >= 0 && alt.niuScore <= 100, `NIU score ${alt.niuScore} must be within 0-100`);
      assert.ok(alt.scoreBreakdown.timeScore >= 0);
      assert.ok(alt.scoreBreakdown.congestionScore >= 0);
      assert.ok(alt.scoreBreakdown.emissionsScore >= 0);
      assert.ok(alt.scoreBreakdown.delayScore >= 0);
      assert.ok(alt.recommendationReason.length > 0, 'Must have computed recommendation rationale');
    }
  });

  test('9. Deterministic Route Output: Bitwise identical results on repeated runs', () => {
    const graph1 = buildRoadGraph(zone, 'normal');
    const routes1 = computeSmartRoutes(graph1, 'pari-chowk', 'knowledge-park', 'NIU_OPTIMAL');

    const graph2 = buildRoadGraph(zone, 'normal');
    const routes2 = computeSmartRoutes(graph2, 'pari-chowk', 'knowledge-park', 'NIU_OPTIMAL');

    assert.equal(routes1.length, routes2.length);
    assert.equal(routes1[0].distanceMeters, routes2[0].distanceMeters);
    assert.equal(routes1[0].durationSeconds, routes2[0].durationSeconds);
    assert.equal(routes1[0].niuScore, routes2[0].niuScore);
    assert.deepEqual(routes1[0].geometry.coordinates, routes2[0].geometry.coordinates);
  });

  test('10. Origin Snapping: Snaps coordinate to nearest usable road node', () => {
    const graph = buildRoadGraph(zone, 'normal');
    // Approximate coordinate near Pari Chowk (28.4682, 77.5105)
    const snap = snapCoordinateToGraph({ latitude: 28.4685, longitude: 77.5108 }, graph, 'Origin');

    assert.ok(snap.nearestNodeId.length > 0);
    assert.ok(snap.distanceMeters < 100, `Snapping distance should be <100m, was ${snap.distanceMeters}m`);
    assert.equal(snap.nearestNodeId, 'pari-chowk');
  });

  test('11. Destination Snapping: Snaps destination coordinate to nearest node', () => {
    const graph = buildRoadGraph(zone, 'normal');
    // Approximate coordinate near Knowledge Park (28.461, 77.4998)
    const snap = snapCoordinateToGraph({ latitude: 28.4612, longitude: 77.5001 }, graph, 'Destination');

    assert.ok(snap.nearestNodeId.length > 0);
    assert.ok(snap.distanceMeters < 100);
    assert.equal(snap.nearestNodeId, 'knowledge-park');
  });

  test('12. Invalid Locations: Throws clean error for out-of-bounds coordinates', () => {
    const graph = buildRoadGraph(zone, 'normal');
    // Coordinate far outside Greater Noida (e.g. Mumbai 19.0760, 72.8777)
    assert.throws(
      () => {
        snapCoordinateToGraph({ latitude: 19.076, longitude: 72.8777 }, graph, 'Origin');
      },
      (err: Error) => {
        return err instanceof SnappingError && err.message.includes('outside the active Mobility Zone');
      }
    );
  });

  test('13. No-Route Condition: Handles disconnected destination gracefully', () => {
    const disconnectedGraph = buildRoadGraph(zone, 'normal');
    // Artificial isolated node with no edges
    disconnectedGraph.nodes.set('isolated-island-node', {
      id: 'isolated-island-node',
      name: 'Island Terminal',
      coordinate: { latitude: 28.47, longitude: 77.51 },
      connectedEdgeIds: [],
      isSignalized: false,
      intersectionDelaySeconds: 0,
    });
    disconnectedGraph.adjacency.set('isolated-island-node', []);

    const path = findPathAStar(disconnectedGraph, 'pari-chowk', 'isolated-island-node', 'NIU_OPTIMAL');
    assert.equal(path, null, 'Must return null when no path connects nodes');
  });

  test('14. Rush-Hour Scenario: Increases volume, delay, and affects travel time', () => {
    const normalGraph = buildRoadGraph(zone, 'normal');
    const rushGraph = buildRoadGraph(zone, 'rush_hour');

    const normalPath = findPathAStar(normalGraph, 'pari-chowk', 'knowledge-park', 'FASTEST')!;
    const rushPath = findPathAStar(rushGraph, 'pari-chowk', 'knowledge-park', 'FASTEST')!;

    assert.ok(normalPath, 'Normal path must exist');
    assert.ok(rushPath, 'Rush path must exist');

    // Rush hour increases road volume and intersection signal delay
    assert.ok(
      rushPath.totalCost > normalPath.totalCost,
      `Rush hour cost (${rushPath.totalCost}) should exceed normal cost (${normalPath.totalCost})`
    );
  });

  test('15. Optimized Scenario: Reduces intersection delay via adaptive signal split', () => {
    const normalGraph = buildRoadGraph(zone, 'normal');
    const optGraph = buildRoadGraph(zone, 'optimized');

    const normalDelay = normalGraph.nodes.get('pari-chowk')!.intersectionDelaySeconds;
    const optDelay = optGraph.nodes.get('pari-chowk')!.intersectionDelaySeconds;

    assert.ok(optDelay < normalDelay, `Optimized delay (${optDelay}s) must be lower than normal (${normalDelay}s)`);
  });

  test('16. Route GeoJSON Generation: Assembles real continuous LineString geometry', () => {
    const graph = buildRoadGraph(zone, 'normal');
    const alternatives = computeSmartRoutes(graph, 'alpha-2', 'jagat-farm', 'NIU_OPTIMAL');
    const geojson = routesToGeoJSON(alternatives);

    assert.equal(geojson.type, 'FeatureCollection');
    assert.ok(geojson.features.length >= 1);

    const firstFeature = geojson.features[0];
    assert.equal(firstFeature.geometry.type, 'LineString');
    assert.ok(firstFeature.geometry.coordinates.length >= 2, 'LineString must have at least 2 points');

    // Check [longitude, latitude] ordering
    const [lng, lat] = firstFeature.geometry.coordinates[0];
    assert.ok(lng > 70 && lng < 85, 'First element must be Longitude');
    assert.ok(lat > 20 && lat < 35, 'Second element must be Latitude');
  });

  test('17. API Validation: Zod schema rejects malformed queries', () => {
    const valid = routeRequestSchema.safeParse({
      origin: 'Galgotias University',
      destination: 'Pari Chowk',
      objective: 'NIU_OPTIMAL',
      scenario: 'normal',
    });
    assert.equal(valid.success, true);

    const invalidShort = routeRequestSchema.safeParse({
      origin: 'A',
      destination: 'Pari Chowk',
    });
    assert.equal(invalidShort.success, false);

    const invalidObjective = routeRequestSchema.safeParse({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      objective: 'TELEPORT_INSTANT',
    });
    assert.equal(invalidObjective.success, false);
  });

  test('18. SmartRoutingEngine: Full orchestrator response shape & provenance', async () => {
    const result = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 2',
      destination: 'Jagat Farm',
      objective: 'NIU_OPTIMAL',
      scenario: 'normal',
    });

    assert.ok(result.routes.length >= 1);
    assert.ok(result.origin.resolvedName.includes('Alpha 2'));
    assert.ok(result.destination.resolvedName.includes('Jagat Farm'));
    assert.ok(result.recommendedRouteId.length > 0);
    assert.equal(result.provenance.traffic, 'SIMULATED — NIU SYNTHETIC DEMAND ENGINE');
    assert.equal(result.provenance.route, 'NIU COMPUTED');
    assert.equal(result.provenance.emissions, 'ESTIMATED — IPCC/CEA CALIBRATED');
  });
});
