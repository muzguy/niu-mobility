import { apiSuccess, apiError } from '@/lib/api-response';
import { locationService } from '@/services/location/location-service';
import { createZoneSchema, getZoneQuerySchema } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    // If coordinates are provided, resolve or create zone around coordinates
    if (latStr && lngStr) {
      const radius = searchParams.get('radius') || '1200';
      const name = searchParams.get('name') || undefined;

      const validation = getZoneQuerySchema.safeParse({
        lat: latStr,
        lng: lngStr,
        radius,
        name,
      });

      if (!validation.success) {
        return apiError(
          'VALIDATION_ERROR',
          'Invalid coordinates or radius',
          400,
          validation.error.flatten().fieldErrors
        );
      }

      const { lat, lng, radius: radiusMeters, name: zoneName } = validation.data;
      const zone = await locationService.createMobilityZone(
        zoneName || `Zone (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        { latitude: lat, longitude: lng },
        radiusMeters
      );

      return apiSuccess(zone);
    }

    // Otherwise, list all registered Mobility Zones
    const zones = await locationService.listMobilityZones();
    return apiSuccess({
      count: zones.length,
      zones,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to query mobility zones';
    return apiError('ZONE_QUERY_FAILED', message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('VALIDATION_ERROR', 'Request body must be valid JSON', 400);
    }

    const validation = createZoneSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Invalid Mobility Zone payload',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const { name, latitude, longitude, radiusMeters } = validation.data;
    const zone = await locationService.createMobilityZone(
      name,
      { latitude, longitude },
      radiusMeters
    );

    return apiSuccess(zone, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create mobility zone';
    return apiError('ZONE_CREATION_FAILED', message, 500);
  }
}
