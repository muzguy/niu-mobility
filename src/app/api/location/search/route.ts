import { apiSuccess, apiError } from '@/lib/api-response';
import { locationService } from '@/services/location/location-service';
import { locationSearchSchema } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '5';

    if (!q || q.trim().length === 0) {
      return apiError('VALIDATION_ERROR', 'Search query parameter "q" is required', 400);
    }

    const validation = locationSearchSchema.safeParse({ q, limit });
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid location search query',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const results = await locationService.searchLocations(
      validation.data.q,
      validation.data.limit
    );

    return apiSuccess({
      query: validation.data.q,
      count: results.length,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Location search failed';
    return apiError('LOCATION_SEARCH_ERROR', message, 500);
  }
}
