import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { routeRequestSchema } from '@/lib/validations';
import { routesService } from '@/services/routes/routes-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin') || 'Alpha 1';
    const destination = searchParams.get('destination') || 'Knowledge Park';

    const validation = routeRequestSchema.safeParse({ origin, destination });
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid route query parameters',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const comparison = await routesService.getRouteComparison(
      validation.data.origin,
      validation.data.destination
    );

    return apiSuccess(comparison);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Route query failed';
    return apiError('ROUTE_QUERY_FAILED', message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
    }

    const validation = routeRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid route request payload',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const comparison = await routesService.getRouteComparison(
      validation.data.origin,
      validation.data.destination
    );

    return apiSuccess(comparison, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Route comparison calculation failed';
    return apiError('ROUTE_CALCULATION_FAILED', message, 500);
  }
}
