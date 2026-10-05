import { CityMobilityMetrics, SimulationEvent } from '@/types/mobility';

export const INITIAL_CITY_METRICS: CityMobilityMetrics = {
  trafficLoadPct: 68,
  activeTrips: 342,
  estimatedCo2SavedTons: 1.82,
  averageDelayMinutes: 14,
  averageSpeedKmH: 23.4,
  activeCarpoolTrips: 87,
  optimizedSignalsCount: 14,
  emergencyCorridorsCleared: 3,
  timestamp: new Date().toISOString(),
};

export interface HourlyTrafficData {
  time: string;
  loadPct: number;
  avgSpeedKmH: number;
  delayMinutes: number;
  vehicleVolume: number;
  co2EmittedKg: number;
}

export const HOURLY_TRAFFIC_DATA: HourlyTrafficData[] = [
  { time: '00:00', loadPct: 18, avgSpeedKmH: 48, delayMinutes: 2, vehicleVolume: 120, co2EmittedKg: 42 },
  { time: '02:00', loadPct: 12, avgSpeedKmH: 52, delayMinutes: 1, vehicleVolume: 80, co2EmittedKg: 28 },
  { time: '04:00', loadPct: 15, avgSpeedKmH: 50, delayMinutes: 2, vehicleVolume: 95, co2EmittedKg: 34 },
  { time: '06:00', loadPct: 32, avgSpeedKmH: 42, delayMinutes: 5, vehicleVolume: 240, co2EmittedKg: 95 },
  { time: '07:00', loadPct: 54, avgSpeedKmH: 31, delayMinutes: 9, vehicleVolume: 490, co2EmittedKg: 185 },
  { time: '08:00', loadPct: 82, avgSpeedKmH: 19, delayMinutes: 17, vehicleVolume: 780, co2EmittedKg: 340 },
  { time: '09:00', loadPct: 91, avgSpeedKmH: 15, delayMinutes: 22, vehicleVolume: 890, co2EmittedKg: 410 },
  { time: '10:00', loadPct: 76, avgSpeedKmH: 22, delayMinutes: 14, vehicleVolume: 710, co2EmittedKg: 310 },
  { time: '11:00', loadPct: 62, avgSpeedKmH: 27, delayMinutes: 10, vehicleVolume: 580, co2EmittedKg: 245 },
  { time: '12:00', loadPct: 58, avgSpeedKmH: 29, delayMinutes: 9, vehicleVolume: 540, co2EmittedKg: 225 },
  { time: '13:00', loadPct: 55, avgSpeedKmH: 30, delayMinutes: 8, vehicleVolume: 510, co2EmittedKg: 215 },
  { time: '14:00', loadPct: 59, avgSpeedKmH: 28, delayMinutes: 9, vehicleVolume: 550, co2EmittedKg: 230 },
  { time: '15:00', loadPct: 64, avgSpeedKmH: 26, delayMinutes: 11, vehicleVolume: 610, co2EmittedKg: 260 },
  { time: '16:00', loadPct: 72, avgSpeedKmH: 23, delayMinutes: 13, vehicleVolume: 690, co2EmittedKg: 295 },
  { time: '17:00', loadPct: 86, avgSpeedKmH: 17, delayMinutes: 19, vehicleVolume: 840, co2EmittedKg: 380 },
  { time: '18:00', loadPct: 94, avgSpeedKmH: 14, delayMinutes: 24, vehicleVolume: 920, co2EmittedKg: 435 },
  { time: '19:00', loadPct: 88, avgSpeedKmH: 16, delayMinutes: 20, vehicleVolume: 860, co2EmittedKg: 395 },
  { time: '20:00', loadPct: 68, avgSpeedKmH: 24, delayMinutes: 14, vehicleVolume: 650, co2EmittedKg: 280 },
  { time: '21:00', loadPct: 50, avgSpeedKmH: 33, delayMinutes: 8, vehicleVolume: 460, co2EmittedKg: 190 },
  { time: '22:00', loadPct: 35, avgSpeedKmH: 40, delayMinutes: 4, vehicleVolume: 290, co2EmittedKg: 120 },
];

export const INITIAL_SIMULATION_EVENTS: SimulationEvent[] = [
  {
    id: 'evt-1',
    timestamp: 'Just now',
    category: 'signal',
    title: 'Adaptive Cycle Optimized',
    description: 'Pari Chowk North split increased to 46s (+14%) to clear upstream queue.',
    severity: 'success',
  },
  {
    id: 'evt-2',
    timestamp: '2 min ago',
    category: 'carpool',
    title: 'High-Affinity Carpool Matched',
    description: '3 commuters pooled on Alpha 1 → Knowledge Park corridor (8.4 kg CO2 avoided).',
    severity: 'info',
  },
  {
    id: 'evt-3',
    timestamp: '5 min ago',
    category: 'traffic',
    title: 'Bottleneck Detected',
    description: 'Jagat Farm retail crossing queue reached 74m. Average velocity down to 15 km/h.',
    severity: 'warning',
  },
  {
    id: 'evt-4',
    timestamp: '12 min ago',
    category: 'emergency',
    title: 'Emergency Priority Pre-emption',
    description: 'Ambulance #AMB-108 prioritized via Pari Chowk corridor. 3m 41s transit saved.',
    severity: 'alert',
  },
  {
    id: 'evt-5',
    timestamp: '24 min ago',
    category: 'sustainability',
    title: 'Daily CO2 Milestone Exceeded',
    description: 'Citywide avoided emissions crossed 1.8 metric tons milestone.',
    severity: 'success',
  },
];
