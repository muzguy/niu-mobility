import { apiSuccess, apiError } from '@/lib/api-response';
import { trafficService } from '@/services/traffic/traffic-service';

export async function GET() {
  try {
    const trafficState = await trafficService.getTrafficState();
    return apiSuccess(trafficState);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve traffic state';
    return apiError('TRAFFIC_FETCH_FAILED', message, 500);
  }
}
