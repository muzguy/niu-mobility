export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export type DataProvenanceSource =
  | 'osm'
  | 'live_sensor'
  | 'government'
  | 'simulation'
  | 'estimated'
  | 'modelled'
  | 'seed';


export interface DataProvenance {
  source: DataProvenanceSource;
  timestamp?: string;
  confidence?: number; // 0.0 to 1.0
  freshness?: string;
  notes?: string;
  provider?: string;
}

export interface DataAvailability {
  roadNetwork: 'real' | 'fallback' | 'simulated';
  traffic: 'live' | 'simulated';
  liveSensors: 'connected' | 'unavailable';
}

export interface GeoRoadSegment {
  id: string;
  name?: string;
  coordinates: Coordinate[];
  highwayType?: string; // motorway, trunk, primary, secondary, tertiary, residential, service
  lanes?: number;
  maxSpeedKph?: number;
  oneWay?: boolean;
  source: 'osm' | 'seed';
  lengthMeters?: number;
  estimatedCapacityVehPerHour?: number;
}

export interface MobilityIntersection {
  id: string;
  name?: string;
  latitude: number;
  longitude: number;
  connectedRoadIds: string[];
  source: 'osm' | 'seed';
  trafficSignal?: boolean;
  type?: 'roundabout' | 'signal' | 'crossroad' | 'junction';
}

export interface MobilityZone {
  id: string;
  name: string;
  displayName: string;
  center: Coordinate;
  radiusMeters: number;
  boundingBox: BoundingBox;
  roads: GeoRoadSegment[];
  intersections: MobilityIntersection[];
  source: 'osm' | 'seed' | 'geocoded';
  dataAvailability: DataAvailability;
  provenance: DataProvenance;
  poiCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationSearchResult {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  importance?: number;
  source: 'osm' | 'seed';
  boundingBox?: BoundingBox;
}

export interface ZoneTrafficTelemetry {
  zoneId: string;
  zoneName: string;
  center: Coordinate;
  radiusMeters: number;
  dataAvailability: DataAvailability;
  provenance: DataProvenance;
  intersections: import('./traffic').Intersection[];
  metrics: import('./mobility').CityMobilityMetrics;
  activeCorridor: string;
  totalVehiclesApproaching: number;
  averageQueueMeters: number;
  averageWaitMinutes: number;
  timestamp: string;
}
