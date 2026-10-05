import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { classifyRoadTraffic } from '@/lib/map/traffic-classifier';
import {
  roadsToGeoJSON,
  intersectionsToGeoJSON,
  buildEmergencyCorridorGeoJSON,
  generateSimulatedVehicles,
} from '@/lib/map/geojson-converter';
import { getMapStyle, isWebGLSupported } from '@/lib/map/map-styles';
import { SEEDED_MOBILITY_ZONES } from '@/data/mobility-zones-seed';
import { GeoRoadSegment, MobilityIntersection } from '@/types/geospatial';
import { ZoneMapPayload } from '@/types/map';
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

describe('NIU Phase 8 — Geospatial Mobility Map Architecture Tests', () => {
  // =========================================================================
  // 1. Mobility Zone Map Payload
  // =========================================================================
  describe('1. Mobility Zone Map Payload', () => {
    test('Seeded mobility zones contain valid road network and intersection nodes', () => {
      const coreZone = SEEDED_MOBILITY_ZONES.find((z) => z.id === 'greater-noida-core');
      assert.ok(coreZone, 'Greater Noida Core zone should exist in seed data');
      assert.ok(coreZone.roads.length > 0, 'Zone should contain road segments');
      assert.ok(coreZone.intersections.length > 0, 'Zone should contain intersection nodes');
      assert.ok(coreZone.center.latitude > 0 && coreZone.center.longitude > 0, 'Center coordinates must be valid');
    });

    test('Zone can be transformed into a standard ZoneMapPayload structure', () => {
      const zone = SEEDED_MOBILITY_ZONES[0];
      const roadGeoJSON = roadsToGeoJSON(zone.roads, 'normal');
      const intersectionGeoJSON = intersectionsToGeoJSON(zone.intersections);

      const payload: ZoneMapPayload = {
        zoneId: zone.id,
        zoneName: zone.name,
        center: [zone.center.longitude, zone.center.latitude],
        boundingBox: zone.boundingBox,
        radiusMeters: zone.radiusMeters,
        roadNetwork: roadGeoJSON,
        intersections: intersectionGeoJSON,
        emergencyCorridor: undefined,
        dataAvailability: zone.dataAvailability,
        provenance: zone.provenance,
        lastSimulatedAt: new Date().toISOString(),
      };

      assert.strictEqual(payload.roadNetwork.type, 'FeatureCollection');
      assert.strictEqual(payload.intersections.type, 'FeatureCollection');
      assert.strictEqual(payload.dataAvailability.roadNetwork, 'real');
      assert.strictEqual(payload.dataAvailability.traffic, 'simulated');
      assert.strictEqual(payload.dataAvailability.liveSensors, 'unavailable');
      assert.strictEqual(payload.roadNetwork.features.length, zone.roads.length);
    });
  });

  // =========================================================================
  // 2. Road GeoJSON Conversion
  // =========================================================================
  describe('2. Road GeoJSON Conversion', () => {
    test('Correctly converts GeoRoadSegments and traffic states to MapLibre LineString features', () => {
      const road = createMockRoad('road-101', 'primary', [
        { latitude: 28.40, longitude: 77.50 },
        { latitude: 28.41, longitude: 77.51 },
      ]);
      const fc = roadsToGeoJSON([road], 'normal');

      assert.strictEqual(fc.type, 'FeatureCollection');
      assert.strictEqual(fc.features.length, 1);

      const feature = fc.features[0];
      assert.strictEqual(feature.geometry.type, 'LineString');
      assert.deepStrictEqual(feature.geometry.coordinates, [
        [77.50, 28.40],
        [77.51, 28.41],
      ]);
      assert.ok(feature.properties);
      assert.strictEqual(feature.properties.id, 'road-101');
      assert.ok(['FREE_FLOW', 'MODERATE', 'CONGESTED', 'SEVERE'].includes(String(feature.properties.trafficState)));
      assert.ok(Number(feature.properties.speedKph) > 0);
      assert.ok(Number(feature.properties.volumeVph) >= 0);
      assert.ok(String(feature.properties.color).startsWith('#'), 'Color should be hex code');
    });
  });

  // =========================================================================
  // 3. Traffic Classification
  // =========================================================================
  describe('3. Traffic Classification', () => {
    test('Calculates valid states: FREE_FLOW, MODERATE, CONGESTED, or SEVERE', () => {
      const road = createMockRoad('road-trunk', 'trunk');
      const modes = ['normal', 'rush_hour', 'optimized', 'emergency'] as const;
      const validStates = new Set(['FREE_FLOW', 'MODERATE', 'CONGESTED', 'SEVERE']);

      for (const mode of modes) {
        const result = classifyRoadTraffic(road, mode);
        assert.ok(validStates.has(result.trafficState), `State ${result.trafficState} must be valid`);
        assert.ok(result.speedKph > 0, 'Speed must be positive');
        assert.ok(result.volumeVph >= 0, 'Volume must be non-negative');
        assert.ok(result.capacityVph > 0, 'Capacity must be positive');
      }
    });

    test('Rush hour mode increases volume compared to normal mode', () => {
      const road = createMockRoad('road-busy', 'primary');
      const normalResult = classifyRoadTraffic(road, 'normal', 10);
      const rushResult = classifyRoadTraffic(road, 'rush_hour', 10);

      assert.ok(
        rushResult.volumeVph > normalResult.volumeVph,
        `Rush hour volume (${rushResult.volumeVph}) should exceed normal (${normalResult.volumeVph})`
      );
      assert.ok(
        rushResult.speedKph <= normalResult.speedKph,
        `Rush hour speed (${rushResult.speedKph}) should be less or equal to normal (${normalResult.speedKph})`
      );
    });

    test('Optimized mode mitigates congestion and increases speed', () => {
      const road = createMockRoad('road-opt', 'secondary');
      const normalResult = classifyRoadTraffic(road, 'normal', 18);
      const optResult = classifyRoadTraffic(road, 'optimized', 18);

      assert.ok(
        optResult.speedKph >= normalResult.speedKph,
        `Optimized speed (${optResult.speedKph}) should be >= normal speed (${normalResult.speedKph})`
      );
    });
  });

  // =========================================================================
  // 4. Deterministic Traffic Output
  // =========================================================================
  describe('4. Deterministic Traffic Output', () => {
    test('Same road and scenario produces bitwise identical results across multiple runs', () => {
      const road = createMockRoad('road-deterministic-1', 'motorway');

      const run1 = classifyRoadTraffic(road, 'rush_hour', 17);
      const run2 = classifyRoadTraffic(road, 'rush_hour', 17);
      const run3 = classifyRoadTraffic(road, 'rush_hour', 17);

      assert.deepStrictEqual(run1, run2, 'Run 1 and Run 2 must match exactly');
      assert.deepStrictEqual(run2, run3, 'Run 2 and Run 3 must match exactly');
      assert.strictEqual(run1.volumeVph, run2.volumeVph);
      assert.strictEqual(run1.speedKph, run2.speedKph);
      assert.strictEqual(run1.trafficState, run2.trafficState);
    });
  });

  // =========================================================================
  // 5. Empty Road Network Handling
  // =========================================================================
  describe('5. Empty Road Network Handling', () => {
    test('roadsToGeoJSON gracefully returns empty FeatureCollection when no roads exist', () => {
      const emptyFC = roadsToGeoJSON([], 'normal');
      assert.strictEqual(emptyFC.type, 'FeatureCollection');
      assert.strictEqual(emptyFC.features.length, 0);
    });

    test('buildEmergencyCorridorGeoJSON returns empty features gracefully when no roads or intersections exist', () => {
      const corridor = buildEmergencyCorridorGeoJSON([], []);
      assert.strictEqual(corridor.type, 'FeatureCollection');
      assert.strictEqual(corridor.features.length, 0);
    });

    test('generateSimulatedVehicles returns empty FeatureCollection when no roads exist', () => {
      const vehiclesFC = generateSimulatedVehicles([], 0);
      assert.strictEqual(vehiclesFC.type, 'FeatureCollection');
      assert.strictEqual(vehiclesFC.features.length, 0);
    });
  });

  // =========================================================================
  // 6. Malformed Geometry Handling
  // =========================================================================
  describe('6. Malformed Geometry Handling', () => {
    test('Filters out road segments with empty, single-point, or non-numeric coordinates', () => {
      const validRoad = createMockRoad('valid-road', 'primary', [
        { latitude: 28.40, longitude: 77.50 },
        { latitude: 28.41, longitude: 77.51 },
      ]);
      const emptyCoordRoad = createMockRoad('empty-coords', 'primary', []);
      const singlePointRoad = createMockRoad('single-point', 'primary', [
        { latitude: 28.40, longitude: 77.50 },
      ]);
      const nanCoordRoad = {
        ...validRoad,
        id: 'nan-coords',
        coordinates: [
          { latitude: NaN, longitude: 77.50 },
          { latitude: 28.41, longitude: NaN },
        ],
      };

      const roads: GeoRoadSegment[] = [validRoad, emptyCoordRoad, singlePointRoad, nanCoordRoad];
      const fc = roadsToGeoJSON(roads, 'normal');

      assert.strictEqual(fc.features.length, 1, 'Only the 1 valid LineString road should be included');
      assert.ok(fc.features[0].properties);
      assert.strictEqual(fc.features[0].properties.id, 'valid-road');
    });

    test('intersectionsToGeoJSON filters out nodes with NaN or missing coordinates', () => {
      const validIntersection: MobilityIntersection = {
        id: 'node-valid',
        name: 'Valid Chowk',
        latitude: 28.468,
        longitude: 77.502,
        connectedRoadIds: ['road-1'],
        source: 'osm',
        trafficSignal: true,
        type: 'roundabout',
      };

      const invalidIntersection: MobilityIntersection = {
        ...validIntersection,
        id: 'node-invalid',
        latitude: NaN,
        longitude: 77.502,
      };

      const fc = intersectionsToGeoJSON([validIntersection, invalidIntersection]);
      assert.strictEqual(fc.features.length, 1);
      assert.ok(fc.features[0].properties);
      assert.strictEqual(fc.features[0].properties.id, 'node-valid');
    });
  });

  // =========================================================================
  // 7. Zone Switching
  // =========================================================================
  describe('7. Zone Switching', () => {
    test('Switching between zones produces distinct geographic bounds and road networks', () => {
      const zone1 = SEEDED_MOBILITY_ZONES.find((z) => z.id === 'greater-noida-core')!;
      const zone2 = SEEDED_MOBILITY_ZONES.find((z) => z.id === 'galgotias-university')!;
      const zone3 = SEEDED_MOBILITY_ZONES.find((z) => z.id === 'dankaur-junction')!;

      assert.ok(zone1 && zone2 && zone3, 'All 3 zones must exist');

      // Check coordinates are distinct
      assert.notStrictEqual(zone1.center.latitude, zone2.center.latitude);
      assert.notStrictEqual(zone2.center.latitude, zone3.center.latitude);

      // Check bounding boxes are properly ordered: minLat < maxLat, minLng < maxLng
      for (const z of [zone1, zone2, zone3]) {
        assert.ok(z.boundingBox.minLat < z.boundingBox.maxLat, `${z.id} lat bounds valid`);
        assert.ok(z.boundingBox.minLng < z.boundingBox.maxLng, `${z.id} lng bounds valid`);
      }
    });
  });

  // =========================================================================
  // 8. API Failure Fallback
  // =========================================================================
  describe('8. API Failure Fallback', () => {
    test('Seeded fallback zones ensure 100% operational coverage if OSM/Overpass is offline', () => {
      assert.ok(SEEDED_MOBILITY_ZONES.length >= 3, 'At least 3 seeded zones must be available');
      for (const zone of SEEDED_MOBILITY_ZONES) {
        assert.ok(zone.roads.length > 0, `Zone ${zone.id} must have fallback roads`);
        assert.ok(zone.intersections.length > 0, `Zone ${zone.id} must have fallback junctions`);
        assert.strictEqual(zone.source, 'seed');
      }
    });
  });

  // =========================================================================
  // 9. Emergency Corridor
  // =========================================================================
  describe('9. Emergency Corridor', () => {
    test('buildEmergencyCorridorGeoJSON constructs an active EVP corridor from intersections', () => {
      const intersections: MobilityIntersection[] = [
        {
          id: 'int-1',
          name: 'Pari Chowk',
          latitude: 28.468,
          longitude: 77.502,
          connectedRoadIds: ['r1'],
          source: 'osm',
        },
        {
          id: 'int-2',
          name: 'Knowledge Park Hub',
          latitude: 28.460,
          longitude: 77.510,
          connectedRoadIds: ['r1'],
          source: 'osm',
        },
      ];

      const corridor = buildEmergencyCorridorGeoJSON(intersections, []);
      assert.strictEqual(corridor.type, 'FeatureCollection');
      assert.strictEqual(corridor.features.length, 1);
      assert.strictEqual(corridor.features[0].geometry.type, 'LineString');
      assert.ok(corridor.features[0].properties);
      assert.strictEqual(corridor.features[0].properties.status, 'ACTIVE EVP PRE-EMPTION');
      assert.ok(corridor.features[0].geometry.coordinates.length >= 2, 'Corridor must have >= 2 points');
    });

    test('buildEmergencyCorridorGeoJSON returns empty features when insufficient nodes exist', () => {
      const intersections: MobilityIntersection[] = [
        {
          id: 'int-only-one',
          name: 'Single Node',
          latitude: 28.468,
          longitude: 77.502,
          connectedRoadIds: [],
          source: 'osm',
        },
      ];
      const emptyCorridor = buildEmergencyCorridorGeoJSON(intersections, []);
      assert.strictEqual(emptyCorridor.features.length, 0);
    });
  });

  // =========================================================================
  // 10. Map Styles & Client Helpers
  // =========================================================================
  describe('10. Map Styles & Client Helpers', () => {
    test('getMapStyle returns valid dark and light MapLibre style specifications', () => {
      const darkStyle = getMapStyle(true) as StyleSpecification;
      assert.strictEqual(darkStyle.version, 8);
      assert.ok(darkStyle.sources['carto-dark'], 'Dark style should define carto-dark source');
      assert.ok(darkStyle.layers.length > 0, 'Dark style must contain layers');

      const lightStyle = getMapStyle(false) as StyleSpecification;
      assert.strictEqual(lightStyle.version, 8);
      assert.ok(lightStyle.sources['carto-light'], 'Light style should define carto-light source');
    });

    test('isWebGLSupported handles environments without window/document without crashing', () => {
      // In Node environment, window is undefined
      const supported = isWebGLSupported();
      assert.strictEqual(typeof supported, 'boolean');
      assert.strictEqual(supported, false, 'Node environment should gracefully report false');
    });

    test('generateSimulatedVehicles creates animated particle coordinates along roads', () => {
      const road = createMockRoad('road-p1', 'primary', [
        { latitude: 28.468, longitude: 77.502 },
        { latitude: 28.478, longitude: 77.512 },
      ]);
      const vehiclesFC = generateSimulatedVehicles([road], 15, 5);

      assert.strictEqual(vehiclesFC.type, 'FeatureCollection');
      assert.ok(vehiclesFC.features.length > 0, 'Should generate vehicle points along road');
      const v = vehiclesFC.features[0];
      assert.strictEqual(v.geometry.type, 'Point');
      assert.ok(v.geometry.coordinates[0] >= 77.502 && v.geometry.coordinates[0] <= 77.512);
      assert.ok(v.geometry.coordinates[1] >= 28.468 && v.geometry.coordinates[1] <= 28.478);
      assert.ok(v.properties);
      assert.strictEqual(v.properties.roadId, 'road-p1');
    });
  });
});
