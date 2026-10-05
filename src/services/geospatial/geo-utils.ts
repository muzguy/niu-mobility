import { Coordinate, BoundingBox } from '@/types/geospatial';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates great-circle distance between two geographic coordinates using Haversine formula
 */
export function haversineDistanceMeters(c1: Coordinate, c2: Coordinate): number {
  const dLat = toRadians(c2.latitude - c1.latitude);
  const dLon = toRadians(c2.longitude - c1.longitude);

  const lat1 = toRadians(c1.latitude);
  const lat2 = toRadians(c2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Computes bounding box coordinates for a center coordinate and a radius in meters
 */
export function computeBoundingBox(center: Coordinate, radiusMeters: number): BoundingBox {
  // Approximate conversion: 1 deg latitude ≈ 111,320 meters
  const latDelta = radiusMeters / 111320;
  // Longitude delta scales with cosine of latitude
  const lonDelta = radiusMeters / (111320 * Math.cos(toRadians(center.latitude)) || 1);

  return {
    minLat: Number((center.latitude - latDelta).toFixed(6)),
    maxLat: Number((center.latitude + latDelta).toFixed(6)),
    minLng: Number((center.longitude - lonDelta).toFixed(6)),
    maxLng: Number((center.longitude + lonDelta).toFixed(6)),
  };
}

/**
 * Checks whether a coordinate point lies within a bounding box
 */
export function isPointInBoundingBox(point: Coordinate, box: BoundingBox): boolean {
  return (
    point.latitude >= box.minLat &&
    point.latitude <= box.maxLat &&
    point.longitude >= box.minLng &&
    point.longitude <= box.maxLng
  );
}

/**
 * Computes the total cumulative length of a polyline in meters
 */
export function estimateRoadLengthMeters(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistanceMeters(coords[i], coords[i + 1]);
  }
  return total;
}

/**
 * Formats a clean, readable location name from Nominatim or raw strings
 */
export function cleanLocationName(rawName: string): string {
  if (!rawName) return 'Unknown Location';
  // Strip trailing country/pin duplicates if overly verbose
  const parts = rawName.split(',').map((p) => p.trim());
  if (parts.length > 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return rawName;
}

/**
 * Produces an alphanumeric URL-safe slug for zones and entities
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
