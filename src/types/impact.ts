export interface SustainabilityMetrics {
  totalCo2SavedKg: number;
  totalCo2SavedTons: number;
  totalFuelSavedLiters: number;
  vehicleTripsAvoided: number;
  timeSavedMinutes: number;
  idleHoursEliminated: number;
  activeCarpoolers: number;
  treesEquivalent: number;
}

export interface SustainabilityScoreCategory {
  id: string;
  name: string;
  score: number; // 0 - 100
  weight: number; // decimal (sums to 1.0)
  metricLabel: string;
  description: string;
}

export interface SustainabilityScore {
  overallScore: number; // 0 - 100
  ratingBadge: string;
  summary: string;
  breakdown: {
    carpooling: SustainabilityScoreCategory;
    trafficOptimization: SustainabilityScoreCategory;
    routeEfficiency: SustainabilityScoreCategory;
    reducedIdleTime: SustainabilityScoreCategory;
  };
}

export interface EmissionsCalculationInput {
  distanceKm: number;
  vehicleType: 'two_wheeler' | 'compact_car' | 'sedan' | 'suv' | 'bus';
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'ev';
  efficiencyKmPerL?: number;
  occupancy: number;
}

export interface EmissionsCalculationResult {
  fuelConsumedLiters: number;
  totalCo2Kg: number;
  co2PerPassengerKg: number;
  calculationBasis: string;
  isSimulatedEstimate: true;
}

export interface DailyImpactRecord {
  day: string;
  date: string;
  co2AvoidedKg: number;
  carpoolAvoidedKg: number;
  signalsAvoidedKg: number;
  routesAvoidedKg: number;
  tripsAvoided: number;
  fuelSavedLiters: number;
}
