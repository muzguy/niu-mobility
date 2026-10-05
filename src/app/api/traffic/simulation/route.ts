import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { trafficScenarioSchema } from '@/lib/validations';
import { trafficService } from '@/services/traffic/traffic-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
    }

    const validation = trafficScenarioSchema.safeParse(rawBody);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid simulation mode specified',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const result = await trafficService.setScenarioMode(validation.data.mode);
    return apiSuccess(result, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update simulation scenario';
    return apiError('SCENARIO_UPDATE_FAILED', message, 500);
  }
}
