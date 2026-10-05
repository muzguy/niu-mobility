import { z } from 'zod';

export const trafficScenarioSchema = z.object({
  mode: z.enum(['normal', 'rush_hour', 'emergency', 'optimized'], {
    error: 'Mode must be one of: normal, rush_hour, emergency, optimized',
  }),
});

export const signalOptimizationSchema = z.object({
  intersectionId: z
    .string()
    .min(1, 'intersectionId is required')
    .max(64, 'intersectionId too long'),
  vehicleDensity: z
    .number()
    .min(0, 'vehicleDensity must be non-negative')
    .max(2000, 'vehicleDensity exceeds upper boundary'),
  queueLength: z
    .number()
    .min(0, 'queueLength must be non-negative')
    .max(2000, 'queueLength exceeds upper boundary'),
  waitingTime: z
    .number()
    .min(0, 'waitingTime must be non-negative')
    .max(120, 'waitingTime exceeds upper boundary'),
  currentTiming: z
    .object({
      north: z.number().min(5).max(180).default(30),
      south: z.number().min(5).max(180).default(30),
      east: z.number().min(5).max(180).default(30),
      west: z.number().min(5).max(180).default(30),
    })
    .default({ north: 30, south: 30, east: 30, west: 30 }),
  signals: z
    .array(
      z.object({
        direction: z.enum(['north', 'south', 'east', 'west']),
        greenSeconds: z.number().min(0).default(30),
        yellowSeconds: z.number().min(0).default(4),
        redSeconds: z.number().min(0).default(74),
        state: z.enum(['green', 'yellow', 'red']).default('green'),
        queueLengthMeters: z.number().min(0).default(0),
        vehicleCount: z.number().min(0).default(0),
        waitingTimeMinutes: z.number().min(0).default(0),
      })
    )
    .default([]),
});

export const carpoolSearchSchema = z.object({
  origin: z
    .string()
    .min(2, 'Origin must be at least 2 characters')
    .max(100, 'Origin exceeds 100 characters'),
  destination: z
    .string()
    .min(2, 'Destination must be at least 2 characters')
    .max(100, 'Destination exceeds 100 characters'),
  departureTime: z
    .string()
    .min(2, 'Departure time required')
    .max(50, 'Departure time format too long'),
  seats: z
    .number()
    .int('Seats must be an integer')
    .min(1, 'Minimum 1 seat required')
    .max(8, 'Maximum 8 seats allowed')
    .default(1),
});

export const routeRequestSchema = z.object({
  origin: z
    .string()
    .min(2, 'Origin must be at least 2 characters')
    .max(100, 'Origin exceeds 100 characters'),
  destination: z
    .string()
    .min(2, 'Destination must be at least 2 characters')
    .max(100, 'Destination exceeds 100 characters'),
});

export const emergencyPrioritySchema = z.object({
  action: z.enum(['activate', 'cancel', 'toggle'], {
    error: 'Action must be activate, cancel, or toggle',
  }),
  vehicleId: z.string().max(64).optional().default('AMB-108'),
  origin: z.string().max(100).optional(),
  destination: z.string().max(100).optional(),
});
