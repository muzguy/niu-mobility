export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'ev';

export interface CarpoolRide {
  id: string;
  driverName: string;
  driverRating: number;
  driverTripsCount: number;
  vehicleModel: string;
  vehiclePlate: string;
  fuelType: FuelType;
  origin: string;
  destination: string;
  departureTime: string; // e.g. "08:25 AM"
  availableSeats: number;
  totalSeats: number;
  routeOverlapPct: number;
  potentialCo2SavedKg: number;
  distanceKm: number;
  estimatedMinutes: number;
  waypoints: string[];
  verifiedDriver: boolean;
}

export interface RideSearchQuery {
  origin: string;
  destination: string;
  departureTime: string;
  seats: number;
}

export interface RideMatchScoreBreakdown {
  totalScore: number; // 0 - 100
  routeOverlapPct: number;
  timeSimilarityPct: number;
  destinationSimilarityPct: number;
  detourPenaltyPct: number;
}

export interface RideMatchResult {
  ride: CarpoolRide;
  matchScore: number;
  scoreBreakdown: RideMatchScoreBreakdown;
  co2SavingKg: number;
  fuelSavingLiters: number;
  pickupEta: string;
}
