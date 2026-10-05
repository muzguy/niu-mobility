import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { signalOptimizationSchema } from '@/lib/validations';
import { trafficService } from '@/services/traffic/traffic-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
    }

    const validation = signalOptimizationSchema.safeParse(rawBody);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid signal optimization payload',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const result = await trafficService.optimizeIntersectionSignal(validation.data);
    return apiSuccess(result, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Signal optimization failed';
    return apiError('OPTIMIZATION_FAILED', message, 500);
  }
}
