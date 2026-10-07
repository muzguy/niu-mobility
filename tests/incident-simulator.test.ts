import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { SEEDED_MOBILITY_ZONES } from '../src/data/mobility-zones-seed';
import {
  simulateMobilityIncident,
  getIncidentImpactFactors,
  getIncidentTemporalFactor,
} from '../src/lib/traffic/incident-simulator';
import { trafficService } from '../src/services/traffic/traffic-service';
import { incidentSimulationSchema } from '../src/lib/validations';

describe('NIU — WHAT IF? Mobility Incident Simulator Tests', () => {
  const zone = SEEDED_MOBILITY_ZONES.find((z) => z.id === 'greater-noida-core')!;
  const targetIntersection = zone.intersections[0]; // Pari Chowk

  test('1. Determinism: Incident scenario is deterministic', () => {
    const fixedHour = 10;
    const run1 = simulateMobilityIncident(zone, {
      type: 'accident',
      intersectionId: targetIntersection.id,
      severity: 'moderate',
      durationMinutes: 20,
      baseHour: fixedHour,
      scenario: 'normal',
    });

    const run2 = simulateMobilityIncident(zone, {
      type: 'accident',
      intersectionId: targetIntersection.id,
      severity: 'moderate',
      durationMinutes: 20,
      baseHour: fixedHour,
      scenario: 'normal',
    });

    assert.deepEqual(run1.withoutIncident, run2.withoutIncident, 'Baseline metrics must match');
    assert.deepEqual(run1.withIncident, run2.withIncident, 'Incident metrics must match');
    assert.deepEqual(run1.comparison, run2.comparison, 'Comparison items must be bitwise identical');
    assert.deepEqual(run1.horizons, run2.horizons, 'Horizons must be bitwise identical');
    assert.equal(run1.recommendation.action, run2.recommendation.action);
    assert.equal(run1.incident.intersectionId, run2.incident.intersectionId);
  });

  test('2. Severity Sensitivity: Severity monotonically changes traffic impact', () => {
    const minorRun = simulateMobilityIncident(zone, {
      type: 'accident',
      intersectionId: targetIntersection.id,
      severity: 'minor',
      durationMinutes: 20,
      baseHour: 11,
      scenario: 'normal',
    });

    const minorFactors = getIncidentImpactFactors('accident', 'minor');
    const majorFactors = getIncidentImpactFactors('accident', 'major');
    assert.ok(majorFactors.capacityFactor < minorFactors.capacityFactor, 'Major capacity factor must choke more than minor');
    assert.ok(majorFactors.delayMultiplier > minorFactors.delayMultiplier, 'Major delay multiplier must exceed minor');

    const moderateRun = simulateMobilityIncident(zone, {
      type: 'accident',
      intersectionId: targetIntersection.id,
      severity: 'moderate',
      durationMinutes: 20,
      baseHour: 11,
      scenario: 'normal',
    });

    const majorRun = simulateMobilityIncident(zone, {
      type: 'accident',
      intersectionId: targetIntersection.id,
      severity: 'major',
      durationMinutes: 20,
      baseHour: 11,
      scenario: 'normal',
    });

    // Delays: Major > Moderate > Minor
    assert.ok(
      majorRun.withIncident.averageDelayMinutes > moderateRun.withIncident.averageDelayMinutes,
      `Major delay (${majorRun.withIncident.averageDelayMinutes}m) should exceed moderate delay (${moderateRun.withIncident.averageDelayMinutes}m)`
    );
    assert.ok(
      moderateRun.withIncident.averageDelayMinutes > minorRun.withIncident.averageDelayMinutes,
      `Moderate delay (${moderateRun.withIncident.averageDelayMinutes}m) should exceed minor delay (${minorRun.withIncident.averageDelayMinutes}m)`
    );

    // Queues: Major > Moderate > Minor
    assert.ok(
      majorRun.withIncident.averageQueueMeters >= moderateRun.withIncident.averageQueueMeters,
      'Major queue should be greater than or equal to moderate queue'
    );
    assert.ok(
      moderateRun.withIncident.averageQueueMeters >= minorRun.withIncident.averageQueueMeters,
      'Moderate queue should be greater than or equal to minor queue'
    );

    // Speed: Major < Moderate < Minor
    assert.ok(
      majorRun.withIncident.averageSpeedKmH <= moderateRun.withIncident.averageSpeedKmH,
      'Major average speed should be lower or equal to moderate speed'
    );
    assert.ok(
      moderateRun.withIncident.averageSpeedKmH <= minorRun.withIncident.averageSpeedKmH,
      'Moderate average speed should be lower or equal to minor speed'
    );
  });

  test('3. Duration Sensitivity: Duration changes predicted impact and dissipation', () => {
    // 10-minute incident: fully active at NOW, dissipating at +15m, cleared at +30m
    const dur10 = simulateMobilityIncident(zone, {
      type: 'lane_blockage',
      intersectionId: targetIntersection.id,
      severity: 'moderate',
      durationMinutes: 10,
      baseHour: 14,
      scenario: 'normal',
    });

    // 30-minute incident: fully active at NOW, +15m, and +30m
    const dur30 = simulateMobilityIncident(zone, {
      type: 'lane_blockage',
      intersectionId: targetIntersection.id,
      severity: 'moderate',
      durationMinutes: 30,
      baseHour: 14,
      scenario: 'normal',
    });

    // Temporal factors check
    assert.equal(getIncidentTemporalFactor(10, 0), 1.0, '10 min incident at NOW is 1.0');
    assert.equal(getIncidentTemporalFactor(10, 15), 0.25, '10 min incident at +15m is 0.25 residual');
    assert.equal(getIncidentTemporalFactor(10, 30), 0.0, '10 min incident at +30m is 0.0 cleared');

    assert.equal(getIncidentTemporalFactor(30, 0), 1.0, '30 min incident at NOW is 1.0');
    assert.equal(getIncidentTemporalFactor(30, 15), 1.0, '30 min incident at +15m is 1.0 active');
    assert.equal(getIncidentTemporalFactor(30, 30), 1.0, '30 min incident at +30m is 1.0 active');

    // At +30 min horizon, 30m incident must have significantly worse delay than 10m incident
    assert.ok(
      dur30.horizons.plus_30m.withDelayMin > dur10.horizons.plus_30m.withDelayMin,
      `At +30m, 30min incident delay (${dur30.horizons.plus_30m.withDelayMin}) should exceed cleared 10min incident (${dur10.horizons.plus_30m.withDelayMin})`
    );

    // At +30 min horizon, 10m incident delay should equal without-incident delay (fully cleared)
    assert.equal(
      dur10.horizons.plus_30m.withDelayMin,
      dur10.horizons.plus_30m.withoutDelayMin,
      '10 min incident at +30m must be completely restored to baseline delay'
    );
  });

  test('4. Identification: Affected intersection and connected corridors are correctly identified', () => {
    const alpha1 = zone.intersections.find((i) => i.id === 'alpha-1-commercial') || zone.intersections[1];
    const res = simulateMobilityIncident(zone, {
      type: 'road_work',
      intersectionId: alpha1.id,
      severity: 'moderate',
      durationMinutes: 20,
    });

    assert.equal(res.incident.intersectionId, alpha1.id);
    assert.equal(res.incident.intersectionName, alpha1.name);
    assert.equal(res.incident.coordinates.lat, alpha1.latitude);
    assert.equal(res.incident.coordinates.lng, alpha1.longitude);

    assert.ok(res.affectedRoadIds.length > 0, 'Must identify connected road IDs');
    assert.deepEqual(res.affectedRoadIds, alpha1.connectedRoadIds, 'Connected roads should match target intersection legs');
    assert.ok(res.affectedIntersectionIds.includes(alpha1.id));
  });

  test('5. Metric Impact & Deltas: Traffic metrics and prediction horizons update deterministically', () => {
    const res = simulateMobilityIncident(zone, {
      type: 'emergency',
      intersectionId: targetIntersection.id,
      severity: 'major',
      durationMinutes: 20,
      baseHour: 16,
      scenario: 'normal',
    });

    // Check with vs without comparison
    assert.ok(res.withIncident.averageDelayMinutes > res.withoutIncident.averageDelayMinutes);
    assert.ok(res.withIncident.averageSpeedKmH < res.withoutIncident.averageSpeedKmH);
    assert.ok(res.withIncident.averageQueueMeters > res.withoutIncident.averageQueueMeters);
    assert.ok(res.withIncident.estimatedCo2Tons >= res.withoutIncident.estimatedCo2Tons);

    // Comparison rows
    const delayItem = res.comparison.find((c) => c.metric === 'Average Delay');
    assert.ok(delayItem);
    assert.equal(delayItem.status, 'worsened');
    assert.ok(delayItem.delta > 0);

    const speedItem = res.comparison.find((c) => c.metric === 'Average Speed');
    assert.ok(speedItem);
    assert.equal(speedItem.status, 'worsened');
    assert.ok(speedItem.delta < 0);

    // Recommendation should reflect critical impact
    assert.equal(res.recommendation.severity, 'critical');
    assert.ok(res.recommendation.title.includes('Critical Choke Warning'));
  });

  test('6. Baseline Reset: Reset leaves baseline intact without any residual contamination', () => {
    // Calling simulateMobilityIncident produces an isolated pure snapshot
    const baseline = simulateMobilityIncident(zone, {
      type: 'accident',
      intersectionId: targetIntersection.id,
      severity: 'minor',
      durationMinutes: 10,
      baseHour: 12,
    }).withoutIncident;

    // Run a major incident
    simulateMobilityIncident(zone, {
      type: 'emergency',
      intersectionId: targetIntersection.id,
      severity: 'major',
      durationMinutes: 30,
      baseHour: 12,
    });

    // Run another baseline check
    const baselineAfter = simulateMobilityIncident(zone, {
      type: 'accident',
      intersectionId: targetIntersection.id,
      severity: 'minor',
      durationMinutes: 10,
      baseHour: 12,
    }).withoutIncident;

    assert.deepEqual(baseline, baselineAfter, 'Baseline calculations must remain completely identical and unaffected');
  });

  test('7. Immutability: Permanent seed data is never mutated', () => {
    const seedZone = SEEDED_MOBILITY_ZONES.find((z) => z.id === 'greater-noida-core')!;
    const originalIntersectionsSnapshot = JSON.stringify(seedZone.intersections);
    const originalRoadsSnapshot = JSON.stringify(seedZone.roads);

    // Run multiple extreme incidents
    simulateMobilityIncident(seedZone, {
      type: 'emergency',
      intersectionId: targetIntersection.id,
      severity: 'major',
      durationMinutes: 30,
    });

    simulateMobilityIncident(seedZone, {
      type: 'road_work',
      intersectionId: 'knowledge-park-iii',
      severity: 'major',
      durationMinutes: 30,
    });

    // Verify seed zone snapshot remains identical
    assert.equal(
      JSON.stringify(seedZone.intersections),
      originalIntersectionsSnapshot,
      'Seed intersections data must remain 100% untouched'
    );
    assert.equal(
      JSON.stringify(seedZone.roads),
      originalRoadsSnapshot,
      'Seed roads data must remain 100% untouched'
    );
  });

  test('8. Provenance & Truth Labels: Truth statement and disclaimers are preserved', () => {
    const res = simulateMobilityIncident(zone, {
      type: 'accident',
      intersectionId: targetIntersection.id,
      severity: 'moderate',
      durationMinutes: 20,
    });

    assert.equal(res.provenance.source, 'modelled');
    assert.ok(res.provenance.truthStatement.includes('Road Network = REAL (OSM)'));
    assert.ok(res.provenance.truthStatement.includes('Traffic = SIMULATED'));
    assert.ok(res.provenance.truthStatement.includes('Incident = USER-SIMULATED SCENARIO'));
    assert.ok(res.provenance.truthStatement.includes('Traffic Prediction = NIU COMPUTED / MODELLED'));
    assert.ok(res.provenance.truthStatement.includes('Physical Sensors = NOT CONNECTED'));
  });

  test('9. Schema Validation: Incident simulation schema rejects invalid parameters', () => {
    const valid = incidentSimulationSchema.safeParse({
      zoneId: 'greater-noida-core',
      type: 'accident',
      intersectionId: 'pari-chowk',
      severity: 'major',
      durationMinutes: 20,
    });
    assert.ok(valid.success);

    // Invalid type (only 4 allowed)
    const invalidType = incidentSimulationSchema.safeParse({
      type: 'flood',
      intersectionId: 'pari-chowk',
      severity: 'major',
      durationMinutes: 20,
    });
    assert.ok(!invalidType.success, 'Disallowed incident types must be rejected');

    // Invalid duration (only 10, 20, 30 allowed)
    const invalidDuration = incidentSimulationSchema.safeParse({
      type: 'accident',
      intersectionId: 'pari-chowk',
      severity: 'major',
      durationMinutes: 45,
    });
    assert.ok(!invalidDuration.success, 'Invalid durationMinutes must be rejected');
  });

  test('10. Service Layer: TrafficService executes incident simulation smoothly', async () => {
    const res = await trafficService.simulateIncident({
      zoneId: 'greater-noida-core',
      type: 'road_work',
      intersectionId: 'pari-chowk',
      severity: 'minor',
      durationMinutes: 10,
    });

    assert.ok(res);
    assert.equal(res.incident.type, 'road_work');
    assert.ok(res.comparison.length >= 5);
  });
});
