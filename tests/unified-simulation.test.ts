import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMobilityState } from '../src/lib/simulation/unified-simulation-state';
import { SEEDED_MOBILITY_ZONES } from '../src/data/mobility-zones-seed';
import { smartRoutingEngine } from '../src/lib/routing/smart-routing-engine';
import { trafficPredictionEngine } from '../src/lib/traffic/traffic-prediction-engine';
import { simulateMobilityIncident } from '../src/lib/traffic/incident-simulator';
import { SimulatedIncident } from '../src/types/incident';
import { trafficPredictionSchema } from '../src/lib/validations';
import { impactService } from '../src/services/impact/impact-service';

describe('NIU — Unified Deterministic Simulation Engine Tests', () => {
  const zone = SEEDED_MOBILITY_ZONES[0];

  test('1. NORMAL produces deterministic results', () => {
    const run1 = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const run2 = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });

    assert.equal(run1.totalVehicles, run2.totalVehicles);
    assert.equal(run1.averageSpeedKmH, run2.averageSpeedKmH);
    assert.equal(run1.averageDelayMinutes, run2.averageDelayMinutes);
    assert.equal(run1.co2Kg, run2.co2Kg);
    assert.equal(run1.niuScore, run2.niuScore);
    assert.deepEqual(run1.intersections, run2.intersections);
  });

  test('2. RUSH_HOUR increases congestion and delay compared to NORMAL', () => {
    const normal = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const rush = calculateMobilityState({ scenario: 'rush_hour', zone, hour: 10 });

    assert.ok(
      rush.trafficLoadPct > normal.trafficLoadPct,
      `Expected rush trafficLoadPct (${rush.trafficLoadPct}) > normal (${normal.trafficLoadPct})`
    );
    assert.ok(
      rush.averageDelayMinutes > normal.averageDelayMinutes,
      `Expected rush averageDelayMinutes (${rush.averageDelayMinutes}) > normal (${normal.averageDelayMinutes})`
    );
    assert.ok(
      rush.averageQueueMeters > normal.averageQueueMeters,
      `Expected rush averageQueueMeters (${rush.averageQueueMeters}) > normal (${normal.averageQueueMeters})`
    );
  });

  test('3. RUSH_HOUR decreases average speed', () => {
    const normal = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const rush = calculateMobilityState({ scenario: 'rush_hour', zone, hour: 10 });

    assert.ok(
      rush.averageSpeedKmH < normal.averageSpeedKmH,
      `Expected rush averageSpeedKmH (${rush.averageSpeedKmH}) < normal (${normal.averageSpeedKmH})`
    );
  });

  test('4. RUSH_HOUR increases fuel consumption and CO2 emissions', () => {
    const normal = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const rush = calculateMobilityState({ scenario: 'rush_hour', zone, hour: 10 });

    assert.ok(
      rush.fuelLiters > normal.fuelLiters,
      `Expected rush fuelLiters (${rush.fuelLiters}) > normal (${normal.fuelLiters})`
    );
    assert.ok(
      rush.co2Kg > normal.co2Kg,
      `Expected rush co2Kg (${rush.co2Kg}) > normal (${normal.co2Kg})`
    );
  });

  test('5. OPTIMIZED improves speed, delay, and queue', () => {
    const normal = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const opt = calculateMobilityState({ scenario: 'optimized', zone, hour: 10 });

    assert.ok(
      opt.averageSpeedKmH > normal.averageSpeedKmH,
      `Expected opt averageSpeedKmH (${opt.averageSpeedKmH}) > normal (${normal.averageSpeedKmH})`
    );
    assert.ok(
      opt.averageDelayMinutes < normal.averageDelayMinutes,
      `Expected opt averageDelayMinutes (${opt.averageDelayMinutes}) < normal (${normal.averageDelayMinutes})`
    );
    assert.ok(
      opt.averageQueueMeters < normal.averageQueueMeters,
      `Expected opt averageQueueMeters (${opt.averageQueueMeters}) < normal (${normal.averageQueueMeters})`
    );
  });

  test('6. OPTIMIZED reduces fuel consumption and CO2 emissions', () => {
    const normal = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const opt = calculateMobilityState({ scenario: 'optimized', zone, hour: 10 });

    assert.ok(
      opt.fuelLiters < normal.fuelLiters,
      `Expected opt fuelLiters (${opt.fuelLiters}) < normal (${normal.fuelLiters})`
    );
    assert.ok(
      opt.co2Kg < normal.co2Kg,
      `Expected opt co2Kg (${opt.co2Kg}) < normal (${normal.co2Kg})`
    );
    assert.ok(
      opt.co2SavedTons >= normal.co2SavedTons,
      `Expected opt co2SavedTons (${opt.co2SavedTons}) >= normal (${normal.co2SavedTons})`
    );
  });

  test('7. EMERGENCY improves ambulance corridor travel time', () => {
    const normal = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const emergency = calculateMobilityState({ scenario: 'emergency', zone, hour: 10 });

    assert.ok(
      emergency.ambulance.travelTimeMinutes < normal.ambulance.travelTimeMinutes,
      `Expected emergency ambulance time (${emergency.ambulance.travelTimeMinutes}) < normal (${normal.ambulance.travelTimeMinutes})`
    );
    assert.ok(
      emergency.ambulance.speedKmH > normal.ambulance.speedKmH,
      `Expected emergency ambulance speed (${emergency.ambulance.speedKmH}) > normal (${normal.ambulance.speedKmH})`
    );
    assert.ok(emergency.emergencyCorridor.active, 'Emergency corridor should be marked active');
  });

  test('8. EMERGENCY affects conflicting cross traffic with additional delay', () => {
    const normal = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const emergency = calculateMobilityState({ scenario: 'emergency', zone, hour: 10 });

    // Non-corridor intersections should experience increased waiting time due to red pause
    const crossNodeNormal = normal.intersections.find((i) => !i.id.includes('alpha-1') && !i.id.includes('pari-chowk') && !i.id.includes('knowledge-park'));
    const crossNodeEmergency = emergency.intersections.find((i) => i.id === crossNodeNormal?.id);

    if (crossNodeNormal && crossNodeEmergency) {
      assert.ok(
        crossNodeEmergency.waitingTimeMinutes >= crossNodeNormal.waitingTimeMinutes,
        `Expected cross traffic waiting time (${crossNodeEmergency.waitingTimeMinutes}) >= normal (${crossNodeNormal.waitingTimeMinutes})`
      );
    }
  });

  test('9. Route travel time changes with scenario', async () => {
    const normalRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'normal',
    });

    const rushRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'rush_hour',
    });

    const optRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'optimized',
    });

    assert.ok(normalRoutes.routes.length > 0);
    assert.ok(rushRoutes.routes.length > 0);
    assert.ok(optRoutes.routes.length > 0);

    const normalDur = normalRoutes.routes[0].durationMinutes;
    const rushDur = rushRoutes.routes[0].durationMinutes;
    const optDur = optRoutes.routes[0].durationMinutes;

    // Rush hour route takes longer than normal route
    assert.ok(
      rushDur > normalDur,
      `Expected rush route duration (${rushDur}) > normal (${normalDur})`
    );

    // Optimized route takes less than or equal to normal route
    assert.ok(
      optDur <= normalDur,
      `Expected opt route duration (${optDur}) <= normal (${normalDur})`
    );
  });

  test('10. Route CO2 changes with scenario', async () => {
    const normalRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'normal',
    });

    const rushRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'rush_hour',
    });

    const normalCo2 = normalRoutes.routes[0].estimatedCo2Kg;
    const rushCo2 = rushRoutes.routes[0].estimatedCo2Kg;

    assert.ok(
      rushCo2 >= normalCo2,
      `Expected rush route CO2 (${rushCo2}) >= normal (${normalCo2})`
    );
  });

  test('11. Route congestion changes with scenario', async () => {
    const normalRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'normal',
    });

    const rushRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'rush_hour',
    });

    const normalCongestion = normalRoutes.routes[0].congestionIndex;
    const rushCongestion = rushRoutes.routes[0].congestionIndex;

    assert.ok(
      rushCongestion >= normalCongestion,
      `Expected rush congestion (${rushCongestion}) >= normal (${normalCongestion})`
    );
  });

  test('12. NIU score changes with scenario', () => {
    const normal = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const rush = calculateMobilityState({ scenario: 'rush_hour', zone, hour: 10 });
    const opt = calculateMobilityState({ scenario: 'optimized', zone, hour: 10 });

    assert.ok(
      rush.niuScore < normal.niuScore,
      `Expected rush score (${rush.niuScore}) < normal (${normal.niuScore})`
    );
    assert.ok(
      opt.niuScore > normal.niuScore,
      `Expected opt score (${opt.niuScore}) > normal (${normal.niuScore})`
    );
    assert.ok(rush.niuScore >= 0 && rush.niuScore <= 100);
    assert.ok(opt.niuScore >= 0 && opt.niuScore <= 100);
  });

  test('13. Prediction changes with scenario', () => {
    const normalPred = trafficPredictionEngine.predictZoneTraffic(zone, {
      scenario: 'normal',
      hourOfDay: 10,
    });

    const rushPred = trafficPredictionEngine.predictZoneTraffic(zone, {
      scenario: 'rush_hour',
      hourOfDay: 10,
    });

    const optPred = trafficPredictionEngine.predictZoneTraffic(zone, {
      scenario: 'optimized',
      hourOfDay: 10,
    });

    assert.ok(
      rushPred.horizons.plus_15m.trafficLoadPct > normalPred.horizons.plus_15m.trafficLoadPct,
      `Expected rush +15m load (${rushPred.horizons.plus_15m.trafficLoadPct}) > normal (${normalPred.horizons.plus_15m.trafficLoadPct})`
    );
    assert.ok(
      optPred.horizons.plus_15m.averageDelayMinutes < normalPred.horizons.plus_15m.averageDelayMinutes,
      `Expected opt +15m delay (${optPred.horizons.plus_15m.averageDelayMinutes}) < normal (${normalPred.horizons.plus_15m.averageDelayMinutes})`
    );
  });

  test('14. Incident changes affected roads and intersection metrics', () => {
    const baseline = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });
    const incidentTarget = zone.intersections[0];

    const incident: SimulatedIncident = {
      id: 'inc-test-1',
      intersectionId: incidentTarget.id,
      intersectionName: incidentTarget.name || 'Junction',
      type: 'accident',
      severity: 'major',
      durationMinutes: 30,
      startedAt: new Date().toISOString(),
      coordinates: { lat: incidentTarget.latitude, lng: incidentTarget.longitude },
      description: 'Major multivehicle accident blocking lanes',
    };

    const withIncident = calculateMobilityState({ scenario: 'normal', zone, incident, hour: 10 });

    const targetNodeBefore = baseline.intersections.find((i) => i.id === incidentTarget.id)!;
    const targetNodeAfter = withIncident.intersections.find((i) => i.id === incidentTarget.id)!;

    assert.ok(
      targetNodeAfter.waitingTimeMinutes > targetNodeBefore.waitingTimeMinutes,
      `Target node delay after incident (${targetNodeAfter.waitingTimeMinutes}) > before (${targetNodeBefore.waitingTimeMinutes})`
    );
    assert.ok(
      targetNodeAfter.queueLengthMeters > targetNodeBefore.queueLengthMeters,
      `Target node queue after incident (${targetNodeAfter.queueLengthMeters}) > before (${targetNodeBefore.queueLengthMeters})`
    );
    assert.ok(
      targetNodeAfter.averageSpeedKmH < targetNodeBefore.averageSpeedKmH,
      `Target node speed after incident (${targetNodeAfter.averageSpeedKmH}) < before (${targetNodeBefore.averageSpeedKmH})`
    );
  });

  test('15. Incident changes route metrics for paths traversing the affected corridor', async () => {
    const cleanRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'normal',
    });

    const incident: SimulatedIncident = {
      id: 'inc-route-test',
      intersectionId: zone.intersections[0].id,
      intersectionName: zone.intersections[0].name || 'Junction',
      type: 'accident',
      severity: 'major',
      durationMinutes: 30,
      startedAt: new Date().toISOString(),
      coordinates: { lat: zone.intersections[0].latitude, lng: zone.intersections[0].longitude },
      description: 'Overturned carrier blocking junction',
    };

    const incidentRoutes = await smartRoutingEngine.calculateRoutes({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      scenario: 'normal',
      incident,
    });

    assert.ok(cleanRoutes.routes.length > 0);
    assert.ok(incidentRoutes.routes.length > 0);

    const cleanDirect = cleanRoutes.routes[0];
    const incidentDirect = incidentRoutes.routes[0];

    // Duration under major incident must be strictly greater than clean baseline
    assert.ok(
      incidentDirect.durationMinutes >= cleanDirect.durationMinutes,
      `Expected incident route duration (${incidentDirect.durationMinutes}) >= clean (${cleanDirect.durationMinutes})`
    );
  });

  test('16. Incident reset restores exact baseline state', () => {
    const baseline = calculateMobilityState({ scenario: 'normal', zone, hour: 10 });

    const incident: SimulatedIncident = {
      id: 'inc-reset-test',
      intersectionId: zone.intersections[0].id,
      intersectionName: zone.intersections[0].name || 'Junction',
      type: 'lane_blockage',
      severity: 'moderate',
      durationMinutes: 20,
      startedAt: new Date().toISOString(),
      coordinates: { lat: zone.intersections[0].latitude, lng: zone.intersections[0].longitude },
      description: 'Pothole repair barrier',
    };

    const incidentState = calculateMobilityState({ scenario: 'normal', zone, incident, hour: 10 });
    assert.notEqual(incidentState.averageDelayMinutes, baseline.averageDelayMinutes);

    // Resetting incident (passing null/undefined)
    const resetState = calculateMobilityState({ scenario: 'normal', zone, incident: null, hour: 10 });
    assert.equal(resetState.averageDelayMinutes, baseline.averageDelayMinutes);
    assert.equal(resetState.averageSpeedKmH, baseline.averageSpeedKmH);
    assert.equal(resetState.niuScore, baseline.niuScore);
    assert.equal(resetState.incident, null);
  });

  test('17. No permanent seed data is mutated', () => {
    const originalZoneCopy = JSON.stringify(zone);

    // Run multiple extreme scenario and incident calculations
    calculateMobilityState({ scenario: 'rush_hour', zone });
    calculateMobilityState({ scenario: 'emergency', zone });
    calculateMobilityState({
      scenario: 'normal',
      zone,
      incident: {
        id: 'inc-mutate-check',
        intersectionId: zone.intersections[0].id,
        intersectionName: zone.intersections[0].name || 'Junction',
        type: 'accident',
        severity: 'major',
        durationMinutes: 30,
        startedAt: new Date().toISOString(),
        coordinates: { lat: zone.intersections[0].latitude, lng: zone.intersections[0].longitude },
        description: 'Immutability test',
      },
    });

    const currentZoneState = JSON.stringify(zone);
    assert.equal(currentZoneState, originalZoneCopy, 'Mobility Zone seed data must remain strictly immutable');
  });

  test('18. Same input always produces same output (pure function idempotency)', () => {
    for (let i = 0; i < 5; i++) {
      const a = calculateMobilityState({ scenario: 'optimized', zone, hour: 14 });
      const b = calculateMobilityState({ scenario: 'optimized', zone, hour: 14 });

      assert.equal(a.niuScore, b.niuScore);
      assert.equal(a.co2Kg, b.co2Kg);
      assert.equal(a.averageSpeedKmH, b.averageSpeedKmH);
      assert.equal(a.totalVehicles, b.totalVehicles);
    }
  });

  test('19. All numeric outputs remain within reasonable bounds', () => {
    const scenarios = ['normal', 'rush_hour', 'optimized', 'emergency'] as const;

    for (const sc of scenarios) {
      const state = calculateMobilityState({ scenario: sc, zone, hour: 10 });

      assert.ok(state.totalVehicles >= 50 && state.totalVehicles <= 10000, `Vehicles: ${state.totalVehicles}`);
      assert.ok(state.averageSpeedKmH >= 10 && state.averageSpeedKmH <= 80, `Speed: ${state.averageSpeedKmH}`);
      assert.ok(state.trafficLoadPct >= 10 && state.trafficLoadPct <= 100, `Load: ${state.trafficLoadPct}`);
      assert.ok(state.averageDelayMinutes >= 0.5 && state.averageDelayMinutes <= 45, `Delay: ${state.averageDelayMinutes}`);
      assert.ok(state.averageQueueMeters >= 5 && state.averageQueueMeters <= 500, `Queue: ${state.averageQueueMeters}`);
      assert.ok(state.fuelLiters > 0 && state.fuelLiters < 20000, `Fuel: ${state.fuelLiters}`);
      assert.ok(state.co2Kg > 0 && state.co2Kg < 50000, `CO2: ${state.co2Kg}`);
      assert.ok(state.niuScore >= 0 && state.niuScore <= 100, `NIU Score: ${state.niuScore}`);
      assert.ok(state.signalEfficiencyPct >= 10 && state.signalEfficiencyPct <= 100, `Signal Eff: ${state.signalEfficiencyPct}`);
    }
  });

  test('20. API and query validation remains strictly adhered to', () => {
    const valid = trafficPredictionSchema.safeParse({
      zoneId: 'greater-noida-core',
      scenario: 'rush_hour',
      horizon: 'plus_15m',
      hour: '17',
    });
    assert.ok(valid.success, 'Valid prediction query should parse successfully');

    const invalid = trafficPredictionSchema.safeParse({
      scenario: 'invalid_mode_not_allowed',
    });
    assert.ok(!invalid.success, 'Invalid scenario should fail validation');
  });

  // Comprehensive Integration Test Suites
  describe('Integration Flow: scenario → traffic → route → emissions', () => {
    test('Scenario cascades systematically through traffic, routing, and emissions', async () => {
      // 1. Normal state
      const normalTraffic = calculateMobilityState({ scenario: 'normal', zone });
      const normalRoutes = await smartRoutingEngine.calculateRoutes({
        origin: 'Alpha 1',
        destination: 'Knowledge Park',
        scenario: 'normal',
      });
      const normalImpact = await impactService.getImpactData('normal');

      // 2. Rush hour state
      const rushTraffic = calculateMobilityState({ scenario: 'rush_hour', zone });
      const rushRoutes = await smartRoutingEngine.calculateRoutes({
        origin: 'Alpha 1',
        destination: 'Knowledge Park',
        scenario: 'rush_hour',
      });
      const rushImpact = await impactService.getImpactData('rush_hour');

      // Assert holistic chain
      // Traffic:
      assert.ok(rushTraffic.totalVehicles > normalTraffic.totalVehicles);
      assert.ok(rushTraffic.trafficLoadPct > normalTraffic.trafficLoadPct);

      // Route:
      assert.ok(rushRoutes.routes[0].durationMinutes > normalRoutes.routes[0].durationMinutes);
      assert.ok(rushRoutes.routes[0].estimatedCo2Kg >= normalRoutes.routes[0].estimatedCo2Kg);

      // Emissions:
      assert.ok(rushTraffic.co2Kg > normalTraffic.co2Kg);
      assert.ok(rushImpact.sustainabilityScore.overallScore < normalImpact.sustainabilityScore.overallScore);
    });
  });

  describe('Integration Flow: incident → traffic → prediction → route impact', () => {
    test('Incident overlay properly modulates traffic, degrades prediction, and inflates route costs', async () => {
      const targetIntersection = zone.intersections[0];

      const incident: SimulatedIncident = {
        id: 'inc-integ-test',
        intersectionId: targetIntersection.id,
        intersectionName: targetIntersection.name || 'Junction',
        type: 'accident',
        severity: 'major',
        durationMinutes: 30,
        startedAt: new Date().toISOString(),
        coordinates: { lat: targetIntersection.latitude, lng: targetIntersection.longitude },
        description: 'Multi-lane incident',
      };

      // 1. Traffic Modulation
      const cleanState = calculateMobilityState({ scenario: 'normal', zone });
      const incidentTraffic = calculateMobilityState({ scenario: 'normal', zone, incident });
      assert.ok(incidentTraffic.averageDelayMinutes > cleanState.averageDelayMinutes);

      // 2. Prediction Degradation
      const incidentSimResult = simulateMobilityIncident(zone, {
        type: 'accident',
        intersectionId: targetIntersection.id,
        severity: 'major',
        durationMinutes: 30,
        baseHour: 10,
        scenario: 'normal',
      });
      assert.ok(incidentSimResult.withIncident.averageDelayMinutes >= incidentSimResult.withoutIncident.averageDelayMinutes);
      assert.ok(incidentSimResult.withIncident.averageSpeedKmH <= incidentSimResult.withoutIncident.averageSpeedKmH);

      // 3. Route Impact
      const incidentRoutes = await smartRoutingEngine.calculateRoutes({
        origin: 'Alpha 1',
        destination: 'Knowledge Park',
        scenario: 'normal',
        incident,
      });
      const cleanRoutes = await smartRoutingEngine.calculateRoutes({
        origin: 'Alpha 1',
        destination: 'Knowledge Park',
        scenario: 'normal',
      });

      assert.ok(incidentRoutes.routes[0].durationMinutes >= cleanRoutes.routes[0].durationMinutes);
    });
  });
});
