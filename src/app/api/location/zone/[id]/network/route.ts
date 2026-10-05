import { apiSuccess, apiError } from '@/lib/api-response';
import { locationService } from '@/services/location/location-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.trim().length === 0) {
      return apiError('VALIDATION_ERROR', 'Zone ID is required', 400);
    }

    const network = await locationService.getZoneRoadNetwork(id);
    if (!network) {
      return apiError('NETWORK_NOT_FOUND', `Road network for zone "${id}" not found`, 404);
    }

    return apiSuccess({
      zoneId: id,
      roadCount: network.roads.length,
      intersectionCount: network.intersections.length,
      roads: network.roads,
      intersections: network.intersections,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve zone road network';
    return apiError('NETWORK_FETCH_FAILED', message, 500);
  }
}
