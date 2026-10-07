import { apiSuccess, apiError } from '@/lib/api-response';
import { trafficService } from '@/services/traffic/traffic-service';
import { trafficPredictionSchema } from '@/lib/validations';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      zoneId: searchParams.get('zoneId') || undefined,
      horizon: searchParams.get('horizon') || undefined,
      scenario: searchParams.get('scenario') || undefined,
      hour: searchParams.get('hour') || undefined,
    };

    const validation = trafficPredictionSchema.safeParse(query);
    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters for prediction', 400, {
        issues: validation.error.format(),
      });
    }

    const { zoneId, horizon, scenario, hour } = validation.data;

    const prediction = await trafficService.getTrafficPrediction({
      zoneId,
      horizon,
      scenario: scenario as SimulationTrafficMode | undefined,
      hour,
    });

    return apiSuccess(prediction);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate traffic predictions';
    return apiError('PREDICTION_FAILED', message, 500);
  }
}
