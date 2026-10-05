import { apiSuccess, apiError } from '@/lib/api-response';
import { impactService } from '@/services/impact/impact-service';

export async function GET() {
  try {
    const impactData = await impactService.getImpactData();
    return apiSuccess(impactData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve impact metrics';
    return apiError('IMPACT_FETCH_FAILED', message, 500);
  }
}
