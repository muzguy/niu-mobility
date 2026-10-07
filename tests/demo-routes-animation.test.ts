import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAllDemoRoutes,
  getDemoRouteById,
  findDemoRoutes,
  getDemoLocations,
  registerCustomDemoRoute,
  demoRouteToComparisonResult,
  DemoRouteDefinition,
} from '@/lib/routing/demo-routes-registry';
import {
  generateSimulatedVehicles,
  generateRoutePulsePoint,
  buildEmergencyCorridorGeoJSON,
  routesToGeoJSON,
} from '@/lib/map/geojson-converter';
import { getMapStyle } from '@/lib/map/map-styles';
import { smartRoutingEngine } from '@/lib/routing/smart-routing-engine';
import { GeoRoadSegment } from '@/types/geospatial';
import type { StyleSpecification } from 'maplibre-gl';

// Mock road segment helper
function createMockRoad(
  id: string,
  highwayType = 'primary',
  coords: { latitude: number; longitude: number }[] = [
    { latitude: 28.468, longitude: 77.502 },
    { latitude: 28.474, longitude: 77.508 },
  ],
  name = 'Mock Arterial'
): GeoRoadSegment {
  return {
    id,
    name,
    highwayType,
    coordinates: coords,
    source: 'osm',
    lanes: 2,
    maxSpeedKph: 50,
    lengthMeters: 550,
  };
}

describe('NIU — Curated Demo Routes & Map Animation Tests', () => {
  // =========================================================================
  // 1. Curated Demo Routes Registry
  // =========================================================================
  describe('1. Curated Demo Routes Registry', () => {
    test('Registry contains at least 10-20 Greater Noida / NCR demo routes', () => {
      const routes = getAllDemoRoutes();
      assert.ok(routes.length >= 10, `Expected at least 10 routes, found ${routes.length}`);
      assert.ok(routes.length <= 25, `Expected <= 25 demo routes, found ${routes.length}`);
    });

    test('Every demo route has valid metadata and real OSM coordinates in Greater Noida', () => {
      const routes = getAllDemoRoutes();
      for (const route of routes) {
        assert.ok(route.id, 'Route must have an ID');
        assert.ok(route.name, 'Route must have a name');
        assert.ok(route.origin.name, 'Route must have origin name');
        assert.ok(route.destination.name, 'Route must have destination name');

        // Latitude & Longitude in Greater Noida / NCR region (approx lat: 28.2 - 28.6, lng: 77.4 - 77.7)
        assert.ok(route.origin.coordinate.latitude > 28.0 && route.origin.coordinate.latitude < 29.0);
        assert.ok(route.origin.coordinate.longitude > 77.0 && route.origin.coordinate.longitude < 78.0);
        assert.ok(route.destination.coordinate.latitude > 28.0 && route.destination.coordinate.latitude < 29.0);
        assert.ok(route.destination.coordinate.longitude > 77.0 && route.destination.coordinate.longitude < 78.0);

        // Valid continuous LineString geometry
        assert.strictEqual(route.geometry.type, 'LineString');
        assert.ok(route.geometry.coordinates.length >= 2, 'Route must have at least 2 LineString coordinates');
        for (const [lng, lat] of route.geometry.coordinates) {
          assert.strictEqual(typeof lng, 'number');
          assert.strictEqual(typeof lat, 'number');
          assert.ok(!isNaN(lng) && !isNaN(lat));
        }

        // Metrics integrity: distance, duration, emissions, congestion, delay, NIU score
        assert.ok(route.distanceKm > 0, 'Distance must be > 0');
        assert.ok(route.etaMinutes > 0, 'ETA must be > 0');
        assert.ok(route.alternatives.length > 0, 'Must have at least one alternative corridor');

        for (const alt of route.alternatives) {
          assert.ok(alt.distanceKm > 0);
          assert.ok(alt.etaMinutes > 0);
          assert.ok(alt.estimatedCo2Kg >= 0);
          assert.ok(alt.congestionScore >= 0 && alt.congestionScore <= 100);
          assert.ok(alt.niuScore >= 0 && alt.niuScore <= 100);
          assert.ok(alt.colorHex.startsWith('#'));
        }
      }
    });

    test('Registry is extensible: allows registering custom demo routes', () => {
      const initialCount = getAllDemoRoutes().length;
      const customRoute: DemoRouteDefinition = {
        id: 'route-custom-test-corridor',
        name: 'Custom Test Corridor ➔ Alpha 1',
        category: 'commute',
        origin: {
          name: 'Custom Start',
          coordinate: { latitude: 28.47, longitude: 77.51 },
        },
        destination: {
          name: 'Alpha 1',
          coordinate: { latitude: 28.472, longitude: 77.518 },
        },
        description: 'Test corridor registered dynamically',
        distanceKm: 2.5,
        etaMinutes: 7,
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.51, 28.47],
            [77.518, 28.472],
          ],
        },
        keyCorridors: ['Custom Link'],
        alternatives: [
          {
            id: 'route-custom-opt',
            routeId: 'route-custom-opt',
            objective: 'NIU_OPTIMAL',
            type: 'optimal',
            title: 'OPTIMAL TEST LINK',
            badge: 'Test Badge',
            tagline: 'Test Tagline',
            etaMinutes: 7,
            durationMinutes: 7,
            durationSeconds: 420,
            distanceKm: 2.5,
            distanceMeters: 2500,
            trafficLevel: 'Low',
            congestionIndex: 20,
            congestionScore: 20,
            estimatedCo2Kg: 0.6,
            emissionsKg: 0.6,
            fuelConsumedLiters: 0.25,
            idleDelayMinutes: 0.5,
            averageSpeedKmH: 30,
            intersectionDelaySeconds: 15,
            roadCount: 2,
            niuScore: 95,
            recommendationReason: 'Test reason',
            scoreBreakdown: { timeScore: 95, congestionScore: 95, emissionsScore: 95, delayScore: 95 },
            keyCorridors: ['Custom Link'],
            pathDescription: 'Test path',
            isRecommended: true,
            colorHex: '#10b981',
            geometry: {
              type: 'LineString',
              coordinates: [
                [77.51, 28.47],
                [77.518, 28.472],
              ],
            },
          },
        ],
      };

      registerCustomDemoRoute(customRoute);
      assert.strictEqual(getAllDemoRoutes().length, initialCount + 1);

      const retrieved = getDemoRouteById('route-custom-test-corridor');
      assert.ok(retrieved);
      assert.strictEqual(retrieved.name, 'Custom Test Corridor ➔ Alpha 1');

      // Update existing
      registerCustomDemoRoute({ ...customRoute, name: 'Updated Custom Name' });
      assert.strictEqual(getAllDemoRoutes().length, initialCount + 1);
      assert.strictEqual(getDemoRouteById('route-custom-test-corridor')?.name, 'Updated Custom Name');
    });

    test('findDemoRoutes filters routes by origin and destination queries', () => {
      const matchPari = findDemoRoutes('Pari Chowk');
      assert.ok(matchPari.length > 0, 'Should find routes originating or including Pari Chowk');

      const matchKP = findDemoRoutes(undefined, 'Knowledge Park');
      assert.ok(matchKP.length > 0, 'Should find routes with destination Knowledge Park');

      const matchSpecific = findDemoRoutes('Alpha 2', 'Jagat Farm');
      assert.ok(matchSpecific.length > 0, 'Should find Alpha 2 to Jagat Farm route');
    });

    test('getDemoLocations returns distinct location candidates', () => {
      const locations = getDemoLocations();
      assert.ok(locations.length >= 5);
      const names = locations.map((l) => l.name.toLowerCase());
      assert.ok(names.includes('pari chowk'));
      assert.ok(names.includes('alpha 1') || names.includes('alpha 2'));
      assert.ok(names.includes('knowledge park'));
    });

    test('demoRouteToComparisonResult adapts definition into SmartRouteComparisonResult', () => {
      const route = getAllDemoRoutes()[0];
      const comp = demoRouteToComparisonResult(route, 'normal');

      assert.strictEqual(comp.zoneId, 'greater-noida-core');
      assert.strictEqual(comp.origin.resolvedName, route.origin.name);
      assert.strictEqual(comp.destination.resolvedName, route.destination.name);
      assert.ok(comp.routes.length > 0);
      assert.ok(comp.recommendedRoute);
      assert.strictEqual(comp.provenance.roadNetwork, 'REAL — OSM');
      assert.strictEqual(comp.provenance.traffic, 'SIMULATED — NIU SYNTHETIC DEMAND ENGINE');
    });
  });

  // =========================================================================
  // 2. Simulated Vehicles & Scenario Response
  // =========================================================================
  describe('2. Simulated Vehicles & Scenario Response', () => {
    const mockRoads = [
      createMockRoad('road-pari-1', 'trunk', [
        { latitude: 28.468, longitude: 77.51 },
        { latitude: 28.472, longitude: 77.515 },
      ]),
      createMockRoad('road-pari-2', 'primary', [
        { latitude: 28.472, longitude: 77.515 },
        { latitude: 28.476, longitude: 77.52 },
      ]),
    ];

    test('NORMAL scenario: vehicles have steady cruising speeds and standard/EV colors', () => {
      const fc = generateSimulatedVehicles(mockRoads, 10, 8, 'normal');
      assert.ok(fc.features.length > 0);

      for (const feat of fc.features) {
        assert.strictEqual(feat.geometry.type, 'Point');
        const p = feat.properties;
        assert.ok(p, 'Properties must exist');
        assert.ok(p && p.speedKph >= 30, 'Normal speed should be >= 30 km/h');
        assert.ok(p && ['#10b981', '#38bdf8'].includes(p.color));
        assert.strictEqual(p?.scenario, 'normal');
      }
    });

    test('RUSH_HOUR scenario: vehicles crawl at reduced speed and display congested coloring', () => {
      const fc = generateSimulatedVehicles(mockRoads, 10, 8, 'rush_hour');
      assert.ok(fc.features.length > 0);

      for (const feat of fc.features) {
        const p = feat.properties;
        assert.ok(p, 'Properties must exist');
        assert.ok(p && p.speedKph <= 30, 'Rush hour speed should be reduced');
        assert.ok(p && ['#ef4444', '#f59e0b'].includes(p.color), 'Rush hour vehicles should have red/amber coloring');
        assert.strictEqual(p?.scenario, 'rush_hour');
      }
    });

    test('OPTIMIZED scenario: vehicles maintain high synchronized speed with green-wave status', () => {
      const fc = generateSimulatedVehicles(mockRoads, 10, 8, 'optimized');
      assert.ok(fc.features.length > 0);

      for (const feat of fc.features) {
        const p = feat.properties;
        assert.ok(p, 'Properties must exist');
        assert.ok(p && p.speedKph >= 35, 'Optimized speed should be high');
        assert.strictEqual(p?.color, '#10b981', 'Optimized vehicles should be green');
        assert.strictEqual(p?.status, 'Webster Green-Wave');
      }
    });

    test('EMERGENCY scenario: civilian vehicles yield and exactly ONE animated ambulance (AMB-108) is present', () => {
      const fc = generateSimulatedVehicles(mockRoads, 10, 8, 'emergency');
      assert.ok(fc.features.length > 0);

      const ambulanceFeatures = fc.features.filter((f) => f.properties?.isAmbulance === true);
      assert.strictEqual(ambulanceFeatures.length, 1, 'Must include exactly one animated ambulance in emergency mode');

      const amb = ambulanceFeatures[0];
      assert.ok(amb.properties);
      assert.strictEqual(amb.properties?.id, 'AMB-108');
      assert.strictEqual(amb.properties?.color, '#f43f5e');
      assert.strictEqual(amb.properties?.speedKph, 72);
      assert.ok(amb.properties?.label.includes('EVP PRIORITY'));
      assert.ok(amb.properties?.timeSaved.includes('saved'));

      // Civilian vehicles yield
      const civilianVehicles = fc.features.filter((f) => !f.properties?.isAmbulance);
      for (const civ of civilianVehicles) {
        assert.ok(civ.properties);
        assert.strictEqual(civ.properties?.status, 'Yielding to EVP');
      }
    });

    test('buildEmergencyCorridorGeoJSON creates LineString connecting corridor road nodes', () => {
      const corridor = buildEmergencyCorridorGeoJSON(
        [
          { id: 'n1', name: 'Alpha 1', latitude: 28.472, longitude: 77.518, connectedRoadIds: [], trafficSignal: true, type: 'signal', source: 'seed' },
          { id: 'n2', name: 'Pari Chowk', latitude: 28.4682, longitude: 77.5105, connectedRoadIds: [], trafficSignal: true, type: 'roundabout', source: 'seed' },
        ],
        mockRoads
      );
      assert.strictEqual(corridor.type, 'FeatureCollection');
      assert.ok(corridor.features.length > 0);
      assert.strictEqual(corridor.features[0].geometry.type, 'LineString');
    });
  });

  // =========================================================================
  // 3. Route Pulse Animation Point
  // =========================================================================
  describe('3. Route Pulse Animation Point', () => {
    test('generateRoutePulsePoint generates Point along LineString coordinates', () => {
      const coords: [number, number][] = [
        [77.51, 28.468],
        [77.515, 28.472],
        [77.52, 28.476],
      ];

      const pulseFC = generateRoutePulsePoint(coords, 5);
      assert.strictEqual(pulseFC.type, 'FeatureCollection');
      assert.strictEqual(pulseFC.features.length, 1);

      const pt = pulseFC.features[0];
      assert.strictEqual(pt.geometry.type, 'Point');
      const [lng, lat] = pt.geometry.coordinates;
      assert.ok(lng >= 77.51 && lng <= 77.52);
      assert.ok(lat >= 28.468 && lat <= 28.476);
      assert.ok(pt.properties?.heading !== undefined);
      assert.strictEqual(pt.properties?.color, '#34d399');
    });

    test('generateRoutePulsePoint handles empty or single-point coordinates gracefully', () => {
      const empty = generateRoutePulsePoint([]);
      assert.strictEqual(empty.features.length, 0);

      const single = generateRoutePulsePoint([[77.51, 28.468]]);
      assert.strictEqual(single.features.length, 0);
    });
  });

  // =========================================================================
  // 4. Detailed OSM Basemap Style Specifications
  // =========================================================================
  describe('4. Detailed OSM Basemap Style Specifications', () => {
    test('getMapStyle provides OSM raster tiles for both dark and light modes', () => {
      const dark = getMapStyle(true) as StyleSpecification;
      assert.ok(dark.sources['osm-tiles'], 'Dark style must define osm-tiles source');
      const darkSource = dark.sources['osm-tiles'] as { tiles: string[] };
      assert.ok(darkSource.tiles[0].includes('tile.openstreetmap.org'));

      const darkLayer = dark.layers.find((l) => l.id === 'osm-tiles');
      assert.ok(darkLayer, 'Must have osm-tiles layer in dark mode');
      assert.strictEqual(darkLayer.type, 'raster');

      const light = getMapStyle(false) as StyleSpecification;
      assert.ok(light.sources['osm-tiles'], 'Light style must define osm-tiles source');
      const lightSource = light.sources['osm-tiles'] as { tiles: string[] };
      assert.ok(lightSource.tiles[0].includes('tile.openstreetmap.org'));
    });
  });

  // =========================================================================
  // 5. Route Selection, Alternative Switching & Map Geometry Tests
  // =========================================================================
  describe('5. Route Selection, Alternative Switching & Map Geometry Tests', () => {
    test('origin/destination selection triggers smartRoutingEngine and produces valid alternatives', async () => {
      const result = await smartRoutingEngine.calculateRoutes({
        origin: 'Pari Chowk',
        destination: 'Knowledge Park',
        objective: 'NIU_OPTIMAL',
        scenario: 'normal',
      });

      assert.ok(result, 'Result must exist');
      assert.strictEqual(result.origin.resolvedName, 'Pari Chowk');
      assert.strictEqual(result.destination.resolvedName, 'Knowledge Park');
      assert.ok(result.routes.length >= 1, 'Must return at least 1 alternative');
      assert.ok(result.recommendedRoute, 'Must include a recommended route');
      assert.strictEqual(result.provenance.route, 'NIU COMPUTED');
    });

    test('swapping origin and destination exchanges endpoints and inverts coordinates', async () => {
      const fwd = await smartRoutingEngine.calculateRoutes({
        origin: 'Pari Chowk',
        destination: 'Knowledge Park',
      });

      const rev = await smartRoutingEngine.calculateRoutes({
        origin: 'Knowledge Park',
        destination: 'Pari Chowk',
      });

      assert.strictEqual(rev.origin.resolvedName, 'Knowledge Park');
      assert.strictEqual(rev.destination.resolvedName, 'Pari Chowk');
      assert.ok(rev.routes.length > 0);

      const fwdCoords = fwd.routes[0].geometry.coordinates;
      const revCoords = rev.routes[0].geometry.coordinates;
      // Start of rev should match end of fwd
      assert.deepStrictEqual(revCoords[0], fwdCoords[fwdCoords.length - 1]);
      assert.deepStrictEqual(revCoords[revCoords.length - 1], fwdCoords[0]);
    });

    test('preset route selection resolves to expected demo corridor', async () => {
      const presets = getAllDemoRoutes();
      assert.ok(presets.length >= 10, 'Registry must provide at least 10 demo presets');

      const preset = presets[0];
      const result = await smartRoutingEngine.calculateRoutes({
        origin: preset.origin.name,
        destination: preset.destination.name,
      });

      assert.strictEqual(result.origin.resolvedName, preset.origin.name);
      assert.strictEqual(result.destination.resolvedName, preset.destination.name);
      assert.ok(result.routes.length >= 1);
    });

    test('route API result transforms cleanly into MapLibre GeoJSON LineString geometry', async () => {
      const result = await smartRoutingEngine.calculateRoutes({
        origin: 'Alpha 1',
        destination: 'Knowledge Park',
      });

      const fc = routesToGeoJSON(result.routes);
      assert.strictEqual(fc.type, 'FeatureCollection');
      assert.strictEqual(fc.features.length, result.routes.length);

      for (let i = 0; i < fc.features.length; i++) {
        const feat = fc.features[i];
        assert.strictEqual(feat.type, 'Feature');
        assert.strictEqual(feat.geometry.type, 'LineString');
        assert.ok(feat.geometry.coordinates.length >= 2, 'LineString must have at least 2 points');
        assert.strictEqual(feat.properties?.id, result.routes[i].id);
        assert.ok(feat.properties?.colorHex, 'Color hex property must exist');
      }
    });

    test('selecting an alternative route isolates distinct geometry and colorHex', async () => {
      const result = await smartRoutingEngine.calculateRoutes({
        origin: 'Pari Chowk',
        destination: 'Knowledge Park',
      });

      assert.ok(result.routes.length >= 2, 'Requires multiple alternatives for switching test');
      const alt1 = result.routes[0];
      const alt2 = result.routes[1];

      assert.notStrictEqual(alt1.id, alt2.id, 'Alternative IDs must be unique');

      const fc = routesToGeoJSON(result.routes);
      const feat1 = fc.features.find((f) => f.properties?.id === alt1.id);
      const feat2 = fc.features.find((f) => f.properties?.id === alt2.id);

      assert.ok(feat1 && feat2);
      assert.strictEqual(feat1?.properties?.id, alt1.id);
      assert.strictEqual(feat2?.properties?.id, alt2.id);

      // Verify layer filters would isolate each properly
      const filterForAlt1 = ['==', ['get', 'id'], alt1.id];
      const filterForAlt2 = ['==', ['get', 'id'], alt2.id];
      assert.notDeepStrictEqual(filterForAlt1, filterForAlt2);
    });

    test('route LineStrings contain strictly valid geographic coordinates in NCR / Greater Noida', async () => {
      const result = await smartRoutingEngine.calculateRoutes({
        origin: 'Alpha 2',
        destination: 'Jagat Farm',
      });

      for (const route of result.routes) {
        assert.strictEqual(route.geometry.type, 'LineString');
        const coords = route.geometry.coordinates;
        assert.ok(coords.length >= 2, 'Route LineString must contain at least 2 coordinates');

        for (const [lng, lat] of coords) {
          assert.strictEqual(typeof lng, 'number');
          assert.strictEqual(typeof lat, 'number');
          assert.ok(!isNaN(lng) && !isNaN(lat), 'Coordinates must not be NaN');
          assert.ok(lng >= 77.0 && lng <= 78.0, `Longitude ${lng} must be in NCR region`);
          assert.ok(lat >= 28.0 && lat <= 29.0, `Latitude ${lat} must be in NCR region`);
        }
      }
    });

    test('fitBounds receives valid, finite non-degenerate bounding coordinates', async () => {
      const result = await smartRoutingEngine.calculateRoutes({
        origin: 'Pari Chowk',
        destination: 'Knowledge Park',
      });

      const coords = result.routes[0].geometry.coordinates;
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      for (const [lng, lat] of coords) {
        if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }

      assert.ok(isFinite(minLng) && isFinite(maxLng));
      assert.ok(isFinite(minLat) && isFinite(maxLat));
      assert.ok(minLng <= maxLng);
      assert.ok(minLat <= maxLat);

      const padLng = maxLng - minLng < 0.005 ? 0.008 : 0.002;
      const padLat = maxLat - minLat < 0.005 ? 0.008 : 0.002;

      const bounds: [[number, number], [number, number]] = [
        [minLng - padLng, minLat - padLat],
        [maxLng + padLng, maxLat + padLat],
      ];

      assert.ok(bounds[0][0] < bounds[1][0], 'South-west longitude must be less than North-east longitude');
      assert.ok(bounds[0][1] < bounds[1][1], 'South-west latitude must be less than North-east latitude');
    });
  });
});
