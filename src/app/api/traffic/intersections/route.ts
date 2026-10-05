import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { trafficService } from '@/services/traffic/traffic-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const intersection = await trafficService.getIntersectionById(id);
      if (!intersection) {
        return apiError('INTERSECTION_NOT_FOUND', `Intersection '${id}' not found`, 404);
      }
      return apiSuccess(intersection);
    }

    const intersections = await trafficService.getIntersections();
    return apiSuccess({
      total: intersections.length,
      intersections,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve intersections';
    return apiError('INTERSECTIONS_FETCH_FAILED', message, 500);
  }
}
