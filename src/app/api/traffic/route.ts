import { apiSuccess, apiError } from '@/lib/api-response';
import { trafficService } from '@/services/traffic/traffic-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId') || undefined;

    const trafficState = await trafficService.getTrafficState(zoneId);
    return apiSuccess(trafficState);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve traffic state';
    return apiError('TRAFFIC_FETCH_FAILED', message, 500);
  }
}
