import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { carpoolSearchSchema } from '@/lib/validations';
import { carpoolService } from '@/services/carpool/carpool-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
    }

    const validation = carpoolSearchSchema.safeParse(rawBody);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid carpool search parameters',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const result = await carpoolService.searchMatches(validation.data);
    return apiSuccess(result, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Carpool search failed';
    return apiError('CARPOOL_SEARCH_FAILED', message, 500);
  }
}

export async function GET() {
  try {
    const rides = await carpoolService.getAllRides();
    return apiSuccess({
      totalRides: rides.length,
      rides,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve carpool rides';
    return apiError('CARPOOL_FETCH_FAILED', message, 500);
  }
}
