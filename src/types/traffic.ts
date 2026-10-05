export type CongestionLevel = 'low' | 'moderate' | 'severe';

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface DirectionalSignal {
  direction: Direction;
  greenSeconds: number;
  yellowSeconds: number;
  redSeconds: number;
  state: 'green' | 'yellow' | 'red';
  queueLengthMeters: number;
  vehicleCount: number;
  waitingTimeMinutes: number;
}

export interface Intersection {
  id: string;
  name: string;
  shortName: string;
  coordinates: { x: number; y: number }; // SVG canvas coordinates (0-1000 range)
  geoCoordinates: { lat: number; lng: number }; // Real-world Greater Noida anchor
  vehicleCount: number;
  averageSpeedKmH: number;
  queueLengthMeters: number;
  waitingTimeMinutes: number;
  congestionLevel: CongestionLevel;
  signalTiming: Record<Direction, number>; // Green light durations in seconds
  signals: DirectionalSignal[];
  lastOptimizedAt?: string;
  isEmergencyPrioritized?: boolean;
  description: string;
  connectedIntersectionIds: string[];
}

export interface OptimizationInput {
  intersectionId: string;
  vehicleDensity: number;
  queueLength: number;
  waitingTime: number;
  currentTiming: Record<Direction, number>;
  signals: DirectionalSignal[];
}

export interface OptimizationResult {
  intersectionId: string;
  intersectionName: string;
  previousTiming: Record<Direction, number>;
  recommendedTiming: Record<Direction, number>;
  cycleTimeSeconds: number;
  waitingTimeReductionPct: number;
  queueReductionPct: number;
  estimatedCo2SavedKg: number;
  confidenceScore: number;
  calculatedAt: string;
  summaryExplanation: string;
}

export interface EmergencyCorridor {
  active: boolean;
  vehicleId: string;
  vehicleType: 'ambulance' | 'fire_engine';
  origin: string;
  destination: string;
  routeIntersectionIds: string[];
  normalEtaSeconds: number;
  niuEtaSeconds: number;
  timeSavedSeconds: number;
  currentStep: number;
  progressPct: number;
  status: 'idle' | 'en_route' | 'clearing_intersections' | 'arrived';
}
