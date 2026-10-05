import { apiSuccess, apiError } from '@/lib/api-response';
import { locationService } from '@/services/location/location-service';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.trim().length === 0) {
      return apiError('VALIDATION_ERROR', 'Zone ID is required', 400);
    }

    const { searchParams } = new URL(request.url);
    const hourParam = searchParams.get('hour');
    const scenarioParam = searchParams.get('scenario') as SimulationTrafficMode | null;

    const hour = hourParam !== null ? parseInt(hourParam, 10) : undefined;
    const scenario =
      scenarioParam && ['normal', 'rush_hour', 'emergency', 'optimized'].includes(scenarioParam)
        ? scenarioParam
        : undefined;

    const trafficState = await locationService.getZoneTrafficState(id, {
      hour: isNaN(hour as number) ? undefined : hour,
      scenario,
    });

    if (!trafficState) {
      return apiError(
        'ZONE_NOT_FOUND',
        `Mobility Zone "${id}" not found or telemetry could not be generated`,
        404
      );
    }

    return apiSuccess(trafficState);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve zone traffic state';
    return apiError('ZONE_TRAFFIC_FAILED', message, 500);
  }
}
