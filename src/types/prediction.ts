import { CongestionLevel } from './traffic';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { DataProvenance } from './geospatial';

export type PredictionHorizon = 'now' | 'plus_5m' | 'plus_15m' | 'plus_30m';

export type PredictionTrend = 'improving' | 'stable' | 'worsening';

export type RecommendationSeverity = 'info' | 'advisory' | 'warning' | 'critical';

export interface IntersectionPrediction {
  intersectionId: string;
  name: string;
  shortName: string;
  horizon: PredictionHorizon;
  minutesAhead: number;
  predictedVehicleCount: number;
  predictedAverageSpeedKmH: number;
  predictedCongestionLevel: CongestionLevel;
  predictedQueueMeters: number;
  predictedDelayMinutes: number;
  volumeCapacityRatio: number;
  confidenceScore: number;
  trend: PredictionTrend;
}

export interface CorridorPrediction {
  corridorId: string;
  name: string;
  fromIntersection: string;
  toIntersection: string;
  horizon: PredictionHorizon;
  minutesAhead: number;
  predictedVolumeVph: number;
  predictedSpeedKmH: number;
  predictedCongestionLevel: CongestionLevel;
  predictedDelayMinutes: number;
  volumeCapacityRatio: number;
  confidenceScore: number;
  trend: PredictionTrend;
}

export interface PredictionMetricBasis {
  currentDelayMinutes: number;
  predictedDelayMinutes: number;
  delayDeltaPercent: number;
  currentSpeedKmH: number;
  predictedSpeedKmH: number;
  volumeCapacityRatio: number;
  predictedQueueMeters: number;
}

export interface PredictionRecommendation {
  id: string;
  title: string;
  message: string;
  action: string;
  severity: RecommendationSeverity;
  targetEntity: string;
  horizon: PredictionHorizon;
  metricBasis: PredictionMetricBasis;
}

export interface HorizonSummary {
  horizon: PredictionHorizon;
  minutesAhead: number;
  label: string;
  forecastTimestamp: string;
  averageSpeedKmH: number;
  trafficLoadPct: number;
  totalVehicles: number;
  averageDelayMinutes: number;
  averageQueueMeters: number;
  trend: PredictionTrend;
  confidence: number;
  intersections: IntersectionPrediction[];
  corridors: CorridorPrediction[];
}

export interface PredictiveProvenance extends DataProvenance {
  truthStatement: string;
  modelType: string;
  parameters: {
    bprAlpha: number;
    bprBeta: number;
    scenario: SimulationTrafficMode;
    diurnalFactor: number;
  };
}

export interface TrafficPredictionResult {
  zoneId: string;
  zoneName: string;
  scenario: SimulationTrafficMode;
  generatedAt: string;
  baseHour: number;
  horizons: Record<PredictionHorizon, HorizonSummary>;
  recommendations: PredictionRecommendation[];
  provenance: PredictiveProvenance;
}
