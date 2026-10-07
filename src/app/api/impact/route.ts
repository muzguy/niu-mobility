import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { impactService } from '@/services/impact/impact-service';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

export async function GET(req: NextRequest) {
  try {
    const scenario = (req.nextUrl.searchParams.get('scenario') || 'normal') as SimulationTrafficMode;
    const impactData = await impactService.getImpactData(scenario);
    return apiSuccess(impactData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve impact metrics';
    return apiError('IMPACT_FETCH_FAILED', message, 500);
  }
}
