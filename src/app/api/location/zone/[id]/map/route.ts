import { apiSuccess, apiError } from '@/lib/api-response';
import { locationService } from '@/services/location/location-service';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import {
  roadsToGeoJSON,
  intersectionsToGeoJSON,
  buildEmergencyCorridorGeoJSON,
} from '@/lib/map/geojson-converter';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.trim().length === 0) {
      return apiError('VALIDATION_ERROR', 'Zone ID is required', 400);
    }

    const { searchParams } = new URL(request.url);
    const scenario = (searchParams.get('scenario') as SimulationTrafficMode) || 'normal';
    const hourParam = searchParams.get('hour');
    const hour = hourParam !== null ? parseInt(hourParam, 10) : undefined;
    const minutesAheadParam = searchParams.get('minutesAhead');
    const horizonParam = searchParams.get('horizon');

    let minutesAhead = 0;
    if (minutesAheadParam !== null) {
      minutesAhead = parseInt(minutesAheadParam, 10) || 0;
    } else if (horizonParam === '15m' || horizonParam === 'plus_15m') {
      minutesAhead = 15;
    } else if (horizonParam === '30m' || horizonParam === 'plus_30m') {
      minutesAhead = 30;
    }

    const zone = await locationService.getMobilityZone(id);
    if (!zone) {
      return apiError('ZONE_NOT_FOUND', `Mobility Zone "${id}" not found`, 404);
    }

    // Get active simulated telemetry for intersection metrics
    const telemetry = await locationService.getZoneTrafficState(id, {
      scenario,
      hour: isNaN(hour as number) ? undefined : hour,
    });

    const roadNetworkGeoJSON = roadsToGeoJSON(zone.roads, scenario, hour, minutesAhead);

    const intersectionsGeoJSON = intersectionsToGeoJSON(
      zone.intersections,
      telemetry?.intersections
    );
    const emergencyCorridorGeoJSON = buildEmergencyCorridorGeoJSON(
      zone.intersections,
      zone.roads
    );

    return apiSuccess({
      zoneId: zone.id,
      zoneName: zone.name,
      displayName: zone.displayName,
      center: [zone.center.longitude, zone.center.latitude], // [lng, lat]
      radiusMeters: zone.radiusMeters,
      boundingBox: zone.boundingBox,
      roadNetwork: roadNetworkGeoJSON,
      intersections: intersectionsGeoJSON,
      emergencyCorridor: emergencyCorridorGeoJSON,
      dataAvailability: zone.dataAvailability,
      provenance: telemetry?.provenance || zone.provenance,
      lastSimulatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve zone map payload';
    return apiError('MAP_PAYLOAD_FAILED', message, 500);
  }
}
