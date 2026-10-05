import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { routeRequestSchema } from '@/lib/validations';
import { routesService } from '@/services/routes/routes-service';
import { RoutingObjective } from '@/types/routing';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin') || 'Alpha 1';
    const destination = searchParams.get('destination') || 'Knowledge Park';
    const zoneId = searchParams.get('zoneId') || 'greater-noida-core';
    const objective = (searchParams.get('objective') || 'NIU_OPTIMAL') as RoutingObjective;
    const scenario = (searchParams.get('scenario') || 'normal') as SimulationTrafficMode;

    const validation = routeRequestSchema.safeParse({
      origin,
      destination,
      zoneId,
      objective,
      scenario,
    });

    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid route query parameters',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const comparison = await routesService.getSmartRouteComparison(
      validation.data.origin,
      validation.data.destination,
      {
        zoneId: validation.data.zoneId,
        objective: validation.data.objective,
        scenario: validation.data.scenario,
      }
    );

    return apiSuccess(comparison);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Route query failed';
    const isClientError =
      message.includes('outside the active Mobility Zone') ||
      message.includes('Location not found');

    return apiError(
      isClientError ? 'INVALID_LOCATION' : 'ROUTE_QUERY_FAILED',
      message,
      isClientError ? 400 : 500
    );
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

    const comparison = await routesService.getSmartRouteComparison(
      validation.data.origin,
      validation.data.destination,
      {
        zoneId: validation.data.zoneId,
        objective: validation.data.objective,
        scenario: validation.data.scenario,
        vehicleType: validation.data.vehicleType,
      }
    );

    return apiSuccess(comparison, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Route comparison calculation failed';
    const isClientError =
      message.includes('outside the active Mobility Zone') ||
      message.includes('Location not found');

    return apiError(
      isClientError ? 'INVALID_LOCATION' : 'ROUTE_CALCULATION_FAILED',
      message,
      isClientError ? 400 : 500
    );
  }
}
