import { apiSuccess, apiError } from '@/lib/api-response';
import { trafficService } from '@/services/traffic/traffic-service';
import { incidentSimulationSchema } from '@/lib/validations';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { IncidentDurationMinutes } from '@/types/incident';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = incidentSimulationSchema.safeParse(body);

    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Invalid parameters for incident simulation', 400, {
        issues: validation.error.format(),
      });
    }

    const { zoneId, type, intersectionId, severity, durationMinutes, baseHour, scenario } = validation.data;

    const result = await trafficService.simulateIncident({
      zoneId,
      type,
      intersectionId,
      severity,
      durationMinutes: durationMinutes as IncidentDurationMinutes,
      baseHour,
      scenario: scenario as SimulationTrafficMode | undefined,
    });

    return apiSuccess(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to simulate incident scenario';
    return apiError('INCIDENT_SIMULATION_FAILED', message, 500);
  }
}
