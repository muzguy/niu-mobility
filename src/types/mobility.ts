import { CongestionLevel } from './traffic';

export interface CityMobilityMetrics {
  trafficLoadPct: number;
  activeTrips: number;
  estimatedCo2SavedTons: number;
  averageDelayMinutes: number;
  averageSpeedKmH: number;
  activeCarpoolTrips: number;
  optimizedSignalsCount: number;
  emergencyCorridorsCleared: number;
  timestamp: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  fromIntersectionId: string;
  toIntersectionId: string;
  distanceKm: number;
  lanes: number;
  congestionLevel: CongestionLevel;
  averageSpeedKmH: number;
  svgPath: string; // SVG path coordinates for custom vector map
}

export interface VehicleItem {
  id: string;
  type: 'ev' | 'hybrid' | 'petrol' | 'diesel' | 'ambulance' | 'bus';
  label: string;
  segmentId: string;
  speedKmH: number;
  isCarpool: boolean;
  passengers: number;
  positionPercent: number; // 0-100 along the road segment
}

export interface SimulationEvent {
  id: string;
  timestamp: string;
  category: 'traffic' | 'signal' | 'carpool' | 'emergency' | 'sustainability';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'alert';
}
