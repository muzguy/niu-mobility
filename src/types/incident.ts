export type IncidentType = 'accident' | 'road_work' | 'lane_blockage' | 'emergency';

export type IncidentSeverity = 'minor' | 'moderate' | 'major';

export type IncidentDurationMinutes = 10 | 20 | 30;

export interface SimulatedIncident {
  id: string;
  type: IncidentType;
  intersectionId: string;
  intersectionName: string;
  severity: IncidentSeverity;
  durationMinutes: IncidentDurationMinutes;
  startedAt: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
}

export interface MetricComparisonItem {
  metric: string;
  unit: string;
  before: number;
  after: number;
  delta: number;
  deltaPercent: number;
  status: 'worsened' | 'improved' | 'unchanged';
}

export interface IncidentImpactMetrics {
  trafficLoadPct: number;
  averageSpeedKmH: number;
  averageDelayMinutes: number;
  averageQueueMeters: number;
  estimatedCo2Tons: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface HorizonImpactComparison {
  withoutDelayMin: number;
  withDelayMin: number;
  withoutSpeedKmH: number;
  withSpeedKmH: number;
  withoutLoadPct: number;
  withLoadPct: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface IncidentSimulationResult {
  incident: SimulatedIncident;
  affectedRoadIds: string[];
  affectedIntersectionIds: string[];
  withoutIncident: IncidentImpactMetrics;
  withIncident: IncidentImpactMetrics;
  comparison: MetricComparisonItem[];
  horizons: Record<'now' | 'plus_15m' | 'plus_30m', HorizonImpactComparison>;
  recommendation: {
    title: string;
    message: string;
    action: string;
    severity: 'advisory' | 'warning' | 'critical';
  };
  provenance: {
    source: 'modelled';
    truthStatement: string;
    notes: string;
    provider: string;
    timestamp: string;
  };
}
