import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { emergencyPrioritySchema } from '@/lib/validations';
import { emergencyService } from '@/services/emergency/emergency-service';

export async function GET() {
  try {
    const status = await emergencyService.getEmergencyStatus();
    return apiSuccess(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve emergency corridor status';
    return apiError('EMERGENCY_STATUS_FAILED', message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
    }

    const validation = emergencyPrioritySchema.safeParse(rawBody);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid emergency priority parameters',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const { action, vehicleId } = validation.data;
    const result = await emergencyService.setEmergencyPriority(action, vehicleId);

    return apiSuccess(result, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Emergency priority pre-emption failed';
    return apiError('EMERGENCY_PRIORITY_FAILED', message, 500);
  }
}
