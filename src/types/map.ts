import { DataProvenance } from './geospatial';

export type TrafficState = 'FREE_FLOW' | 'MODERATE' | 'CONGESTED' | 'SEVERE';

export interface MapRoadTraffic {
  roadId: string;
  name: string;
  highwayType: string;
  lanes: number;
  trafficState: TrafficState;
  speedKph: number;
  freeFlowSpeedKph: number;
  volumeVph: number;
  capacityVph: number;
  occupancyPercent: number;
  queueLengthMeters: number;
  isEmergencyCorridor: boolean;
  confidence: number;
  source: 'simulation' | 'live';
}

export interface MapLayerToggles {
  showTraffic: boolean;
  showIntersections: boolean;
  showEmergency: boolean;
  showVehicles: boolean;
}

export interface MapPopupInfo {
  type: 'road' | 'intersection';
  coordinates: [number, number]; // [lng, lat]
  title: string;
  properties: Record<string, unknown>;
}

export interface SimulatedVehicle {
  id: string;
  type: 'ev' | 'hybrid' | 'standard' | 'ambulance';
  roadId: string;
  coordinates: [number, number]; // [lng, lat]
  heading: number; // degrees 0-360
  speedKph: number;
  progressPercent: number; // 0-100 along segment
}

export interface ZoneMapPayload {
  zoneId: string;
  zoneName: string;
  center: [number, number]; // [lng, lat]
  radiusMeters: number;
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  roadNetwork: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  intersections: GeoJSON.FeatureCollection<GeoJSON.Point>;
  emergencyCorridor?: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  dataAvailability: {
    roadNetwork: 'real' | 'fallback' | 'simulated';
    traffic: 'live' | 'simulated';
    liveSensors: 'connected' | 'unavailable';
  };
  provenance: DataProvenance;
  lastSimulatedAt: string;
}
