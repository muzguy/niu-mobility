import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { SEEDED_MOBILITY_ZONES } from '../src/data/mobility-zones-seed';
import {
  TrafficPredictionEngine,
  trafficPredictionEngine,
  calculatePredictionConfidence,
  classifyPredictionCongestion,
  determineTrend,
  calculateBprSpeed,
  getInterpolatedDiurnalFactor,
  HORIZONS,
} from '../src/lib/traffic/traffic-prediction-engine';
import { trafficPredictionSchema } from '../src/lib/validations';
import { trafficService } from '../src/services/traffic/traffic-service';

describe('NIU Phase 10 — Predictive Traffic Intelligence Tests', () => {
  const zone = SEEDED_MOBILITY_ZONES.find((z) => z.id === 'greater-noida-core')!;

  test('1. Determinism: Identical inputs produce bitwise identical predictions', () => {
    const customEngine = new TrafficPredictionEngine();
    assert.ok(customEngine instanceof TrafficPredictionEngine);

    const fixedTime = '2026-10-07T12:00:00.000Z';
    const run1 = trafficPredictionEngine.predictZoneTraffic(zone, {
      hourOfDay: 9,
      scenario: 'rush_hour',
      isWeekend: false,
      timestamp: fixedTime,
    });


    const run2 = trafficPredictionEngine.predictZoneTraffic(zone, {
      hourOfDay: 9,
      scenario: 'rush_hour',
      isWeekend: false,
      timestamp: fixedTime,
    });


    assert.deepEqual(run1.horizons.now, run2.horizons.now, 'NOW horizon must be identical');
    assert.deepEqual(run1.horizons.plus_5m, run2.horizons.plus_5m, '+5m horizon must be identical');
    assert.deepEqual(run1.horizons.plus_15m, run2.horizons.plus_15m, '+15m horizon must be identical');
    assert.deepEqual(run1.horizons.plus_30m, run2.horizons.plus_30m, '+30m horizon must be identical');
    assert.deepEqual(run1.recommendations, run2.recommendations, 'Recommendations must be identical');
    assert.equal(run1.provenance.confidence, run2.provenance.confidence);
  });

  test('2. Horizon Sensitivity: +15m and +30m predictions change dynamically with demand progression', () => {
    // 8:00 AM is entering the academic arrival rush (08:00 -> 09:00 multiplier surges from 1.42 to 1.55)
    const prediction = trafficPredictionEngine.predictZoneTraffic(zone, {
      hourOfDay: 8,
      scenario: 'normal',
      isWeekend: false,
    });

    const now = prediction.horizons.now;
    const plus15 = prediction.horizons.plus_15m;
    const plus30 = prediction.horizons.plus_30m;

    assert.ok(plus15.minutesAhead === 15, '+15m minutesAhead should be 15');
    assert.ok(plus30.minutesAhead === 30, '+30m minutesAhead should be 30');

    // Demand should escalate as time moves closer to 09:00 peak
    assert.ok(
      plus30.totalVehicles > now.totalVehicles,
      `Vehicles should increase towards peak (+30m: ${plus30.totalVehicles} vs now: ${now.totalVehicles})`
    );

    // Diurnal factor interpolation check
    const factor0 = getInterpolatedDiurnalFactor(8, 0, false);
    const factor15 = getInterpolatedDiurnalFactor(8, 15, false);
    const factor30 = getInterpolatedDiurnalFactor(8, 30, false);

    assert.ok(factor15 > factor0, '+15m diurnal factor should be greater than 8:00 AM baseline');
    assert.ok(factor30 > factor15, '+30m diurnal factor should be greater than +15m');
  });

  test('3. Scenario Sensitivity: Rush Hour vs Normal vs Webster Optimized', () => {
    const normal = trafficPredictionEngine.predictZoneTraffic(zone, {
      hourOfDay: 14,
      scenario: 'normal',
    });

    const rushHour = trafficPredictionEngine.predictZoneTraffic(zone, {
      hourOfDay: 14,
      scenario: 'rush_hour',
    });

    const optimized = trafficPredictionEngine.predictZoneTraffic(zone, {
      hourOfDay: 14,
      scenario: 'optimized',
    });

    // Rush Hour should have higher volume, higher delay, lower speed
    assert.ok(
      rushHour.horizons.plus_15m.totalVehicles > normal.horizons.plus_15m.totalVehicles,
      'Rush hour volume must exceed normal volume'
    );
    assert.ok(
      rushHour.horizons.plus_15m.averageDelayMinutes > normal.horizons.plus_15m.averageDelayMinutes,
      'Rush hour delay must exceed normal delay'
    );
    assert.ok(
      rushHour.horizons.plus_15m.averageSpeedKmH < normal.horizons.plus_15m.averageSpeedKmH,
      'Rush hour speed must drop below normal speed'
    );

    // Optimized should have lower queue and lower delay than rush hour
    assert.ok(
      optimized.horizons.plus_15m.averageDelayMinutes < rushHour.horizons.plus_15m.averageDelayMinutes,
      'Webster optimized delay must be lower than rush hour delay'
    );
    assert.ok(
      optimized.horizons.plus_15m.averageQueueMeters < rushHour.horizons.plus_15m.averageQueueMeters,
      'Webster optimized queue must be lower than rush hour queue'
    );
  });

  test('4. Congestion Trend Classification: Accurately classifies improving, stable, and worsening', () => {
    // Delta volume or delay > +5% -> worsening
    assert.equal(determineTrend(0.08, 0.02), 'worsening', 'Volume surge > 5% must be worsening');
    assert.equal(determineTrend(0.01, 0.12), 'worsening', 'Delay surge > 5% must be worsening');

    // Delta volume and delay < -5% -> improving
    assert.equal(determineTrend(-0.08, -0.06), 'improving', 'Both dropping > 5% must be improving');

    // Negligible delta -> stable
    assert.equal(determineTrend(0.01, 0.02), 'stable', 'Small delta must be stable');
    assert.equal(determineTrend(-0.02, 0.01), 'stable', 'Small delta must be stable');

    // Congestion level classification
    assert.equal(classifyPredictionCongestion(0.95, 18), 'severe');
    assert.equal(classifyPredictionCongestion(0.65, 30), 'moderate');
    assert.equal(classifyPredictionCongestion(0.35, 45), 'low');
  });

  test('5. Prediction Confidence: Strictly bounded between 0 and 1, decays with horizon', () => {
    const scenarios = ['normal', 'rush_hour', 'emergency', 'optimized'] as const;

    for (const sc of scenarios) {
      for (const h of HORIZONS) {
        const conf = calculatePredictionConfidence(h.minutes, sc);
        assert.ok(conf >= 0.0 && conf <= 1.0, `Confidence ${conf} for ${sc} at ${h.minutes}m must be in [0, 1]`);
        assert.ok(conf >= 0.60 && conf <= 0.95, `Confidence ${conf} must remain within calibrated [0.60, 0.95] band`);
      }

      const conf0 = calculatePredictionConfidence(0, sc);
      const conf15 = calculatePredictionConfidence(15, sc);
      const conf30 = calculatePredictionConfidence(30, sc);

      assert.ok(conf0 > conf15, 'Confidence must decay from NOW to +15m');
      assert.ok(conf15 > conf30, 'Confidence must decay from +15m to +30m');
    }
  });

  test('6. Dynamic Recommendations: Generated from actual calculated metrics, not hardcoded', () => {
    const prediction = trafficPredictionEngine.predictZoneTraffic(zone, {
      hourOfDay: 17, // Evening peak
      scenario: 'rush_hour',
    });

    assert.ok(prediction.recommendations.length > 0, 'Must generate at least one recommendation');

    for (const rec of prediction.recommendations) {
      assert.ok(rec.id.length > 0, 'Recommendation ID must not be empty');
      assert.ok(rec.title.length > 0, 'Title must not be empty');
      assert.ok(rec.message.length > 0, 'Message must not be empty');
      assert.ok(rec.action.length > 0, 'Action must not be empty');
      assert.ok(['info', 'advisory', 'warning', 'critical'].includes(rec.severity), 'Invalid severity');
      assert.ok(rec.targetEntity.length > 0, 'Target entity must not be empty');

      // Metric basis validation
      const mb = rec.metricBasis;
      assert.ok(typeof mb.currentDelayMinutes === 'number' && !isNaN(mb.currentDelayMinutes));
      assert.ok(typeof mb.predictedDelayMinutes === 'number' && !isNaN(mb.predictedDelayMinutes));
      assert.ok(typeof mb.delayDeltaPercent === 'number' && !isNaN(mb.delayDeltaPercent));
      assert.ok(typeof mb.currentSpeedKmH === 'number' && !isNaN(mb.currentSpeedKmH));
      assert.ok(typeof mb.predictedSpeedKmH === 'number' && !isNaN(mb.predictedSpeedKmH));
      assert.ok(typeof mb.volumeCapacityRatio === 'number' && !isNaN(mb.volumeCapacityRatio));
      assert.ok(typeof mb.predictedQueueMeters === 'number' && !isNaN(mb.predictedQueueMeters));

      // Message must reference dynamic metrics
      assert.ok(
        rec.message.includes('%') || rec.message.includes('min') || rec.message.includes('queue'),
        'Message must dynamically cite calculated metric values'
      );
    }

    // Emergency scenario synthesizes EVP directive
    const emergencyPrediction = trafficPredictionEngine.predictZoneTraffic(zone, {
      scenario: 'emergency',
    });
    const evpRec = emergencyPrediction.recommendations.find((r) => r.id === 'rec-evp-directive');
    assert.ok(evpRec, 'Emergency scenario must generate EVP mobility directive');
  });

  test('7. BPR Speed-Flow Relationship Calculation', () => {
    const freeFlow = 50; // km/h

    const speedFree = calculateBprSpeed(freeFlow, 0.1);
    const speedModerate = calculateBprSpeed(freeFlow, 0.6);
    const speedHeavy = calculateBprSpeed(freeFlow, 1.1);

    assert.ok(speedFree >= 48, 'Low volume must stay close to free-flow speed');
    assert.ok(speedModerate < speedFree, 'Moderate volume must experience slight speed deficit');
    assert.ok(speedHeavy < speedModerate, 'High volume (V/C > 1) must experience steep BPR speed drop');
    assert.ok(speedHeavy >= 10, 'BPR speed must not drop below minimum floor (10 km/h)');
  });

  test('8. API Validation Schema: Rejects invalid parameters and validates defaults', () => {
    // Valid inputs
    const valid1 = trafficPredictionSchema.safeParse({
      zoneId: 'greater-noida-core',
      horizon: 'plus_15m',
      scenario: 'rush_hour',
      hour: 17,
    });
    assert.equal(valid1.success, true);
    assert.equal(valid1.data?.horizon, 'plus_15m');

    // Defaults
    const validDefaults = trafficPredictionSchema.safeParse({});
    assert.equal(validDefaults.success, true);
    assert.equal(validDefaults.data?.zoneId, 'greater-noida-core');
    assert.equal(validDefaults.data?.horizon, 'all');

    // Invalid horizon
    const invalidHorizon = trafficPredictionSchema.safeParse({ horizon: 'plus_45m' });
    assert.equal(invalidHorizon.success, false);

    // Invalid scenario
    const invalidScenario = trafficPredictionSchema.safeParse({ scenario: 'apocalypse' });
    assert.equal(invalidScenario.success, false);

    // Out-of-bounds hour
    const invalidHourUpper = trafficPredictionSchema.safeParse({ hour: 24 });
    assert.equal(invalidHourUpper.success, false);

    const invalidHourLower = trafficPredictionSchema.safeParse({ hour: -1 });
    assert.equal(invalidHourLower.success, false);
  });

  test('9. Data Provenance & Product Truth Rules Compliance', () => {
    const prediction = trafficPredictionEngine.predictZoneTraffic(zone, {
      scenario: 'normal',
    });

    const prov = prediction.provenance;
    assert.equal(prov.source, 'modelled', 'Source must be modelled');
    assert.equal(
      prov.truthStatement,
      'Road Network = REAL (OSM) | Current Traffic = SIMULATED | Traffic Prediction = NIU COMPUTED / MODELLED | Physical Sensors = NOT CONNECTED'
    );
    assert.ok(prov.notes && prov.notes.includes('No live municipal IoT feed connected'));
    assert.ok(prov.provider && prov.provider.includes('NIU Predictive Traffic Engine'));
    assert.ok(prov.confidence !== undefined && prov.confidence >= 0 && prov.confidence <= 1);
  });


  test('10. Service Layer Integration: TrafficService.getTrafficPrediction', async () => {
    const result = await trafficService.getTrafficPrediction({
      zoneId: 'greater-noida-core',
      scenario: 'normal',
      hour: 10,
    });

    assert.ok(result.zoneId === 'greater-noida-core');
    assert.ok(result.horizons.now.intersections.length > 0);
    assert.ok(result.horizons.plus_5m.intersections.length > 0);
    assert.ok(result.horizons.plus_15m.intersections.length > 0);
    assert.ok(result.horizons.plus_30m.intersections.length > 0);
    assert.ok(result.recommendations.length > 0);
  });
});
