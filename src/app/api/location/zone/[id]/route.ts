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

    const zone = await locationService.getMobilityZone(id);
    if (!zone) {
      return apiError('ZONE_NOT_FOUND', `Mobility Zone "${id}" not found`, 404);
    }

    return apiSuccess(zone);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve mobility zone';
    return apiError('ZONE_FETCH_FAILED', message, 500);
  }
}
