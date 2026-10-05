import { VehicleItem } from '@/types/mobility';

export interface VehicleEfficiencySpec {
  type: string;
  category: 'two_wheeler' | 'compact_car' | 'sedan' | 'suv' | 'bus';
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'ev';
  efficiencyKmPerLOrKWh: number; // km/L for combustion, km/kWh for EV
  carbonPerUnit: number; // kg CO2 per Liter or per kWh
  averageOccupancy: number;
}

export const VEHICLE_EMISSION_SPECS: Record<string, VehicleEfficiencySpec> = {
  petrol_compact: {
    type: 'Compact Petrol Hatchback',
    category: 'compact_car',
    fuelType: 'petrol',
    efficiencyKmPerLOrKWh: 16.5,
    carbonPerUnit: 2.31,
    averageOccupancy: 1.2,
  },
  petrol_sedan: {
    type: 'Executive Petrol Sedan',
    category: 'sedan',
    fuelType: 'petrol',
    efficiencyKmPerLOrKWh: 13.8,
    carbonPerUnit: 2.31,
    averageOccupancy: 1.3,
  },
  diesel_suv: {
    type: 'Diesel Midsize SUV',
    category: 'suv',
    fuelType: 'diesel',
    efficiencyKmPerLOrKWh: 14.2,
    carbonPerUnit: 2.68,
    averageOccupancy: 1.4,
  },
  hybrid_sedan: {
    type: 'Strong Hybrid Sedan',
    category: 'sedan',
    fuelType: 'hybrid',
    efficiencyKmPerLOrKWh: 24.5,
    carbonPerUnit: 1.45,
    averageOccupancy: 1.3,
  },
  electric_car: {
    type: 'Battery Electric Vehicle (BEV)',
    category: 'compact_car',
    fuelType: 'ev',
    efficiencyKmPerLOrKWh: 7.2, // km per kWh
    carbonPerUnit: 0.59, // kg CO2 per kWh (Indian central grid factor)
    averageOccupancy: 1.4,
  },
  electric_bus: {
    type: 'Urban Electric Transit Bus',
    category: 'bus',
    fuelType: 'ev',
    efficiencyKmPerLOrKWh: 1.2, // km per kWh
    carbonPerUnit: 0.59,
    averageOccupancy: 34.0,
  },
};

export const INITIAL_SIMULATED_VEHICLES: VehicleItem[] = [
  { id: 'v-101', type: 'ambulance', label: 'AMB-108', segmentId: 'seg-alpha1-pari', speedKmH: 52, isCarpool: false, passengers: 2, positionPercent: 45 },
  { id: 'v-102', type: 'ev', label: 'Nexon EV', segmentId: 'seg-pari-kp', speedKmH: 22, isCarpool: true, passengers: 3, positionPercent: 65 },
  { id: 'v-103', type: 'petrol', label: 'City Sedan', segmentId: 'seg-alpha1-pari', speedKmH: 26, isCarpool: false, passengers: 1, positionPercent: 30 },
  { id: 'v-104', type: 'diesel', label: 'Creta Diesel', segmentId: 'seg-pari-jagat', speedKmH: 15, isCarpool: false, passengers: 1, positionPercent: 80 },
  { id: 'v-105', type: 'hybrid', label: 'Hyryder Hybrid', segmentId: 'seg-jagat-kp', speedKmH: 34, isCarpool: true, passengers: 4, positionPercent: 50 },
  { id: 'v-106', type: 'bus', label: 'CNG City Bus', segmentId: 'seg-pari-kp', speedKmH: 18, isCarpool: false, passengers: 38, positionPercent: 15 },
  { id: 'v-107', type: 'ev', label: 'Ather 450X', segmentId: 'seg-alpha2-pari', speedKmH: 32, isCarpool: false, passengers: 1, positionPercent: 70 },
  { id: 'v-108', type: 'petrol', label: 'i20 Turbo', segmentId: 'seg-alpha1-alpha2', speedKmH: 40, isCarpool: true, passengers: 2, positionPercent: 20 },
];
