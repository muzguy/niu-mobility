import { CarpoolRide, RideMatchResult, RideMatchScoreBreakdown, RideSearchQuery } from '@/types/carpool';

/**
 * Parses time string (e.g. "08:25 AM" or "08:30" or "8:25") into total minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 8 * 60 + 30; // Default 08:30 AM
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');

  const timePart = clean.replace(/(AM|PM)/g, '').trim();
  const [hourStr, minStr] = timePart.split(':');
  let hours = parseInt(hourStr || '8', 10);
  const minutes = parseInt(minStr || '0', 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Calculates deterministic route similarity between search query and driver itinerary
 */
function calculateRouteOverlap(queryOrigin: string, queryDest: string, ride: CarpoolRide): number {
  const normOrigin = queryOrigin.toLowerCase().trim();
  const normDest = queryDest.toLowerCase().trim();
  const rideOrigin = ride.origin.toLowerCase().trim();
  const rideDest = ride.destination.toLowerCase().trim();

  // Exact endpoint match
  if (normOrigin === rideOrigin && normDest === rideDest) {
    return 95;
  }

  // Same origin, waypoint contains destination
  const destInWaypoints = ride.waypoints.some((wp) => wp.toLowerCase().includes(normDest));
  const originInWaypoints = ride.waypoints.some((wp) => wp.toLowerCase().includes(normOrigin));

  if (normOrigin === rideOrigin && destInWaypoints) {
    return 88;
  }

  if (originInWaypoints && normDest === rideDest) {
    return 84;
  }

  if (originInWaypoints && destInWaypoints) {
    return 78;
  }

  // Cross-corridor proximity (e.g. both passing through Pari Chowk hub)
  if (
    (ride.origin.includes('Alpha') && normOrigin.includes('Alpha')) ||
    (ride.destination.includes('Knowledge') && normDest.includes('Knowledge'))
  ) {
    return 72;
  }

  return 55;
}

/**
 * Calculates time similarity score (0 - 100) using linear decay within a 60-minute window
 */
function calculateTimeSimilarity(queryTime: string, rideTime: string): number {
  const qMins = parseTimeToMinutes(queryTime);
  const rMins = parseTimeToMinutes(rideTime);
  const diffMinutes = Math.abs(qMins - rMins);

  if (diffMinutes <= 5) return 100;
  if (diffMinutes <= 15) return 92;
  if (diffMinutes <= 30) return 80;
  if (diffMinutes <= 45) return 60;
  if (diffMinutes <= 60) return 40;
  return Math.max(10, 100 - diffMinutes * 1.2);
}

/**
 * Deterministic Ride Matcher
 * Computes multi-parameter compatibility score without non-deterministic AI.
 */
export function matchRide(query: RideSearchQuery, ride: CarpoolRide): RideMatchResult {
  // Check seat capacity constraint
  const hasSeats = ride.availableSeats >= query.seats;
  const seatFactor = hasSeats ? 1.0 : 0.4;

  const routeOverlapPct = calculateRouteOverlap(query.origin, query.destination, ride);
  const timeSimilarityPct = Math.round(calculateTimeSimilarity(query.departureTime, ride.departureTime));

  const destinationSimilarityPct =
    query.destination.toLowerCase().trim() === ride.destination.toLowerCase().trim()
      ? 100
      : ride.waypoints.some((w) => w.toLowerCase().includes(query.destination.toLowerCase()))
      ? 85
      : 60;

  // Detour penalty based on distance variance
  const detourPenaltyPct = Math.min(25, Math.round(Math.abs(ride.distanceKm - 7.0) * 2));

  // Multi-factor weighted score
  const rawScore =
    routeOverlapPct * 0.45 +
    timeSimilarityPct * 0.30 +
    destinationSimilarityPct * 0.15 -
    detourPenaltyPct * 0.10;

  const totalScore = Math.max(10, Math.min(99, Math.round(rawScore * seatFactor)));

  const scoreBreakdown: RideMatchScoreBreakdown = {
    totalScore,
    routeOverlapPct,
    timeSimilarityPct,
    destinationSimilarityPct,
    detourPenaltyPct,
  };

  // Compute environmental savings based on passenger sharing
  const fuelSavingLiters = Number(((ride.distanceKm / 14.5) * 0.75).toFixed(2));
  const co2SavingKg = Number((fuelSavingLiters * 2.31).toFixed(1));

  return {
    ride,
    matchScore: totalScore,
    scoreBreakdown,
    co2SavingKg,
    fuelSavingLiters,
    pickupEta: ride.departureTime,
  };
}
