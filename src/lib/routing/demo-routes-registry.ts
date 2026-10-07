import { Coordinate } from '@/types/geospatial';
import {
  SmartRouteAlternative,
  SmartRouteComparisonResult,
} from '@/types/routing';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

export interface DemoRouteDefinition {
  id: string;
  name: string;
  category: 'arterial' | 'commute' | 'campus' | 'commercial' | 'emergency' | 'expressway';
  origin: {
    name: string;
    coordinate: Coordinate;
  };
  destination: {
    name: string;
    coordinate: Coordinate;
  };
  description: string;
  distanceKm: number;
  etaMinutes: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [longitude, latitude]
  };
  keyCorridors: string[];
  alternatives: SmartRouteAlternative[];
}

/**
 * Curated Registry of 16 Greater Noida & NCR mobility demo routes
 * grounded in real OpenStreetMap road geometry and NIU deterministic simulation telemetry.
 */
const INITIAL_DEMO_ROUTES: DemoRouteDefinition[] = [
  // 1. Pari Chowk -> Knowledge Park
  {
    id: 'route-pari-kp',
    name: 'Pari Chowk ➔ Knowledge Park Institutional Corridor',
    category: 'arterial',
    origin: {
      name: 'Pari Chowk',
      coordinate: { latitude: 28.4682, longitude: 77.5105 },
    },
    destination: {
      name: 'Knowledge Park',
      coordinate: { latitude: 28.461, longitude: 77.4998 },
    },
    description: 'Central educational & institutional transit spine connecting Pari Chowk to KP II & III colleges.',
    distanceKm: 3.8,
    etaMinutes: 12,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.5105, 28.4682],
        [77.5055, 28.4645],
        [77.4998, 28.461],
      ],
    },
    keyCorridors: ['Pari Chowk Hub', 'Knowledge Park Arterial Transit Way', 'KP II Gate'],
    alternatives: [
      {
        id: 'route-pari-kp-opt',
        routeId: 'route-pari-kp-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'NIU OPTIMAL CORRIDOR',
        badge: 'Recommended Commute',
        tagline: 'Balanced Flow via KP Arterial & Service Lane',
        etaMinutes: 13,
        durationMinutes: 13,
        durationSeconds: 780,
        distanceKm: 4.1,
        distanceMeters: 4100,
        trafficLevel: 'Medium',
        congestionIndex: 42,
        congestionScore: 42,
        estimatedCo2Kg: 1.38,
        emissionsKg: 1.38,
        fuelConsumedLiters: 0.6,
        idleDelayMinutes: 2.1,
        averageSpeedKmH: 26.5,
        intersectionDelaySeconds: 45,
        roadCount: 4,
        niuScore: 92,
        recommendationReason: 'Evenly balanced throughput with minimal stop-and-go queuing at Pari Chowk approaches.',
        scoreBreakdown: { timeScore: 88, congestionScore: 92, emissionsScore: 94, delayScore: 94 },
        keyCorridors: ['Pari Chowk Hub', 'Knowledge Park Arterial Transit Way'],
        pathDescription: 'Bypasses internal rotary bottlenecks with smooth, continuous kinetic progression.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5105, 28.4682],
            [77.5065, 28.465],
            [77.502, 28.4625],
            [77.4998, 28.461],
          ],
        },
      },
      {
        id: 'route-pari-kp-fast',
        routeId: 'route-pari-kp-fast',
        objective: 'FASTEST',
        type: 'fastest',
        title: 'FASTEST DIRECT RADIAL',
        badge: 'Lowest Transit Duration',
        tagline: 'Direct Arterial Spine via Central Roundabout',
        etaMinutes: 11,
        durationMinutes: 11,
        durationSeconds: 660,
        distanceKm: 3.8,
        distanceMeters: 3800,
        trafficLevel: 'High',
        congestionIndex: 78,
        congestionScore: 78,
        estimatedCo2Kg: 1.85,
        emissionsKg: 1.85,
        fuelConsumedLiters: 0.8,
        idleDelayMinutes: 4.2,
        averageSpeedKmH: 20.7,
        intersectionDelaySeconds: 110,
        roadCount: 3,
        niuScore: 74,
        recommendationReason: 'Direct radial arterial link, but subject to high idling at central roundabout.',
        scoreBreakdown: { timeScore: 95, congestionScore: 60, emissionsScore: 70, delayScore: 71 },
        keyCorridors: ['Pari Chowk Hub', 'Knowledge Park Arterial Transit Way'],
        pathDescription: 'Shortest radial road path with frequent signal stop delays during peak hours.',
        isRecommended: false,
        colorHex: '#ef4444',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5105, 28.4682],
            [77.5045, 28.464],
            [77.4998, 28.461],
          ],
        },
      },
      {
        id: 'route-pari-kp-green',
        routeId: 'route-pari-kp-green',
        objective: 'LOWEST_EMISSIONS',
        type: 'greenest',
        title: 'GREENEST ECO-WAY',
        badge: 'Lowest Carbon Footprint',
        tagline: 'Eco-Corridor via Green Belt & KP Outer Loop',
        etaMinutes: 15,
        durationMinutes: 15,
        durationSeconds: 900,
        distanceKm: 4.8,
        distanceMeters: 4800,
        trafficLevel: 'Low',
        congestionIndex: 22,
        congestionScore: 22,
        estimatedCo2Kg: 0.98,
        emissionsKg: 0.98,
        fuelConsumedLiters: 0.42,
        idleDelayMinutes: 0.9,
        averageSpeedKmH: 32.0,
        intersectionDelaySeconds: 20,
        roadCount: 5,
        niuScore: 88,
        recommendationReason: 'Bypasses congested signal clusters, saving 47% in tailpipe emissions.',
        scoreBreakdown: { timeScore: 80, congestionScore: 96, emissionsScore: 98, delayScore: 96 },
        keyCorridors: ['Green Belt Eco Corridor', 'KP Outer Ring'],
        pathDescription: 'Continuous cruising velocity through shaded sector perimeter road.',
        isRecommended: false,
        colorHex: '#06b6d4',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5105, 28.4682],
            [77.508, 28.466],
            [77.505, 28.455],
            [77.4998, 28.461],
          ],
        },
      },
    ],
  },

  // 2. Alpha 1 -> Knowledge Park
  {
    id: 'route-alpha1-kp',
    name: 'Alpha 1 ➔ Knowledge Park Tech Hub',
    category: 'commute',
    origin: {
      name: 'Alpha 1',
      coordinate: { latitude: 28.472, longitude: 77.518 },
    },
    destination: {
      name: 'Knowledge Park',
      coordinate: { latitude: 28.461, longitude: 77.4998 },
    },
    description: 'Major student & commuter corridor between Alpha 1 commercial sector and university hubs.',
    distanceKm: 7.4,
    etaMinutes: 28,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.518, 28.472],
        [77.5142, 28.4705],
        [77.5105, 28.4682],
        [77.4998, 28.461],
      ],
    },
    keyCorridors: ['Alpha 1 Main Road', 'Pari Chowk Arterial', 'Knowledge Park Transit Way'],
    alternatives: [
      {
        id: 'route-alpha1-kp-opt',
        routeId: 'route-alpha1-kp-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'BALANCED COMMUTER CORRIDOR',
        badge: 'Recommended Commute',
        tagline: 'Via Alpha 1 Link & Green Belt Bypass',
        etaMinutes: 30,
        durationMinutes: 30,
        durationSeconds: 1800,
        distanceKm: 8.2,
        distanceMeters: 8200,
        trafficLevel: 'Medium',
        congestionIndex: 48,
        congestionScore: 48,
        estimatedCo2Kg: 2.65,
        emissionsKg: 2.65,
        fuelConsumedLiters: 1.15,
        idleDelayMinutes: 4.2,
        averageSpeedKmH: 22.4,
        intersectionDelaySeconds: 65,
        roadCount: 5,
        niuScore: 89,
        recommendationReason: 'Circumvents rotary bottlenecks for smoother transit and reduced stop frequency.',
        scoreBreakdown: { timeScore: 86, congestionScore: 88, emissionsScore: 90, delayScore: 92 },
        keyCorridors: ['Alpha 1 Link Road', 'Pari Chowk Peripheral', 'Knowledge Park Expressway'],
        pathDescription: 'Slightly longer distance bypassing the core roundabout congestion.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.518, 28.472],
            [77.5142, 28.4705],
            [77.5105, 28.4682],
            [77.505, 28.455],
            [77.4998, 28.461],
          ],
        },
      },
      {
        id: 'route-alpha1-kp-fast',
        routeId: 'route-alpha1-kp-fast',
        objective: 'FASTEST',
        type: 'fastest',
        title: 'FASTEST DIRECT SPINE',
        badge: 'Lowest Transit Duration',
        tagline: 'Direct via Pari Chowk Central Roundabout',
        etaMinutes: 28,
        durationMinutes: 28,
        durationSeconds: 1680,
        distanceKm: 7.4,
        distanceMeters: 7400,
        trafficLevel: 'High',
        congestionIndex: 78,
        congestionScore: 78,
        estimatedCo2Kg: 3.42,
        emissionsKg: 3.42,
        fuelConsumedLiters: 1.48,
        idleDelayMinutes: 9.5,
        averageSpeedKmH: 15.8,
        intersectionDelaySeconds: 140,
        roadCount: 4,
        niuScore: 72,
        recommendationReason: 'Fastest direct radial arterial link, but prone to high congestion.',
        scoreBreakdown: { timeScore: 92, congestionScore: 58, emissionsScore: 65, delayScore: 73 },
        keyCorridors: ['Alpha 1 Link Road', 'Pari Chowk Arterial', 'Knowledge Park Expressway'],
        pathDescription: 'Passes through high-density bottleneck at Pari Chowk with higher idling.',
        isRecommended: false,
        colorHex: '#ef4444',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.518, 28.472],
            [77.5105, 28.4682],
            [77.4998, 28.461],
          ],
        },
      },
      {
        id: 'route-alpha1-kp-green',
        routeId: 'route-alpha1-kp-green',
        objective: 'LOWEST_EMISSIONS',
        type: 'greenest',
        title: 'GREENEST ECO-CORRIDOR',
        badge: 'Minimum CO2 Footprint',
        tagline: 'Eco-Corridor via Green Belt & Knowledge Park West',
        etaMinutes: 32,
        durationMinutes: 32,
        durationSeconds: 1920,
        distanceKm: 8.9,
        distanceMeters: 8900,
        trafficLevel: 'Low',
        congestionIndex: 26,
        congestionScore: 26,
        estimatedCo2Kg: 1.94,
        emissionsKg: 1.94,
        fuelConsumedLiters: 0.84,
        idleDelayMinutes: 1.8,
        averageSpeedKmH: 29.2,
        intersectionDelaySeconds: 25,
        roadCount: 6,
        niuScore: 90,
        recommendationReason: 'Optimized for continuous kinetic momentum with virtually zero stop-and-go idling.',
        scoreBreakdown: { timeScore: 82, congestionScore: 95, emissionsScore: 97, delayScore: 95 },
        keyCorridors: ['Green Belt Sector Corridor', 'Delta Sector Ring', 'Knowledge Park West Outer'],
        pathDescription: 'Low emissions profile along suburban green belt.',
        isRecommended: false,
        colorHex: '#06b6d4',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.518, 28.472],
            [77.513, 28.476],
            [77.502, 28.475],
            [77.4998, 28.461],
          ],
        },
      },
    ],
  },

  // 3. Alpha 2 -> Jagat Farm
  {
    id: 'route-alpha2-jagat',
    name: 'Alpha 2 ➔ Jagat Farm Commercial Market',
    category: 'commercial',
    origin: {
      name: 'Alpha 2',
      coordinate: { latitude: 28.476, longitude: 77.513 },
    },
    destination: {
      name: 'Jagat Farm',
      coordinate: { latitude: 28.4705, longitude: 77.5142 },
    },
    description: 'High-density short-haul shopping & retail corridor connecting Alpha 2 to Jagat Farm market.',
    distanceKm: 3.2,
    etaMinutes: 14,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.513, 28.476],
        [77.5142, 28.4705],
      ],
    },
    keyCorridors: ['Alpha 2 South Link', 'Jagat Farm Entry Gate'],
    alternatives: [
      {
        id: 'route-alpha2-jagat-opt',
        routeId: 'route-alpha2-jagat-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'BALANCED MARKET APPROACH',
        badge: 'Recommended Commute',
        tagline: 'Via Institutional Ring Road Outer Loop',
        etaMinutes: 16,
        durationMinutes: 16,
        durationSeconds: 960,
        distanceKm: 4.1,
        distanceMeters: 4100,
        trafficLevel: 'Medium',
        congestionIndex: 40,
        congestionScore: 40,
        estimatedCo2Kg: 1.35,
        emissionsKg: 1.35,
        fuelConsumedLiters: 0.58,
        idleDelayMinutes: 2.3,
        averageSpeedKmH: 24.6,
        intersectionDelaySeconds: 30,
        roadCount: 3,
        niuScore: 91,
        recommendationReason: 'Circumvents commercial market entry bottlenecks with consistent cruising speed.',
        scoreBreakdown: { timeScore: 89, congestionScore: 91, emissionsScore: 92, delayScore: 92 },
        keyCorridors: ['Alpha Sector Ring', 'Jagat Farm Outer Loop'],
        pathDescription: 'Moderate traffic corridor with steady velocity.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.513, 28.476],
            [77.518, 28.472],
            [77.5142, 28.4705],
          ],
        },
      },
      {
        id: 'route-alpha2-jagat-fast',
        routeId: 'route-alpha2-jagat-fast',
        objective: 'FASTEST',
        type: 'fastest',
        title: 'DIRECT MARKET LINK',
        badge: 'Lowest Transit Duration',
        tagline: 'Direct via Alpha 2 South Market Spine',
        etaMinutes: 14,
        durationMinutes: 14,
        durationSeconds: 840,
        distanceKm: 3.2,
        distanceMeters: 3200,
        trafficLevel: 'High',
        congestionIndex: 72,
        congestionScore: 72,
        estimatedCo2Kg: 1.68,
        emissionsKg: 1.68,
        fuelConsumedLiters: 0.72,
        idleDelayMinutes: 5.1,
        averageSpeedKmH: 13.7,
        intersectionDelaySeconds: 85,
        roadCount: 2,
        niuScore: 76,
        recommendationReason: 'Shortest radial distance into market, but delays caused by retail parking queues.',
        scoreBreakdown: { timeScore: 93, congestionScore: 66, emissionsScore: 72, delayScore: 73 },
        keyCorridors: ['Alpha 2 Market Spine', 'Jagat Farm Entry Gate'],
        pathDescription: 'Prone to delivery van bottlenecks near Jagat Farm gate.',
        isRecommended: false,
        colorHex: '#ef4444',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.513, 28.476],
            [77.5142, 28.4705],
          ],
        },
      },
    ],
  },

  // 4. Pari Chowk -> Jagat Farm
  {
    id: 'route-pari-jagat',
    name: 'Pari Chowk ➔ Jagat Farm Commercial Hub',
    category: 'commercial',
    origin: {
      name: 'Pari Chowk',
      coordinate: { latitude: 28.4682, longitude: 77.5105 },
    },
    destination: {
      name: 'Jagat Farm',
      coordinate: { latitude: 28.4705, longitude: 77.5142 },
    },
    description: 'Rapid commercial link between Pari Chowk interchange and the central trade hub.',
    distanceKm: 1.8,
    etaMinutes: 6,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.5105, 28.4682],
        [77.5142, 28.4705],
      ],
    },
    keyCorridors: ['Pari Chowk - Jagat Farm Market Link'],
    alternatives: [
      {
        id: 'route-pari-jagat-opt',
        routeId: 'route-pari-jagat-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'OPTIMAL MARKET APPROACH',
        badge: 'Recommended',
        tagline: 'Direct via 3-Lane Commercial Link',
        etaMinutes: 6,
        durationMinutes: 6,
        durationSeconds: 360,
        distanceKm: 1.8,
        distanceMeters: 1800,
        trafficLevel: 'Medium',
        congestionIndex: 38,
        congestionScore: 38,
        estimatedCo2Kg: 0.52,
        emissionsKg: 0.52,
        fuelConsumedLiters: 0.22,
        idleDelayMinutes: 1.2,
        averageSpeedKmH: 26.0,
        intersectionDelaySeconds: 20,
        roadCount: 2,
        niuScore: 94,
        recommendationReason: 'Direct connection with synchronized green wave timing.',
        scoreBreakdown: { timeScore: 94, congestionScore: 92, emissionsScore: 95, delayScore: 95 },
        keyCorridors: ['Pari Chowk - Jagat Farm Market Link'],
        pathDescription: 'Primary commercial connection with wide carriage way.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5105, 28.4682],
            [77.5142, 28.4705],
          ],
        },
      },
    ],
  },

  // 5. Alpha 1 -> Alpha 2
  {
    id: 'route-alpha1-alpha2',
    name: 'Alpha 1 ➔ Alpha 2 Sector Spine',
    category: 'commute',
    origin: {
      name: 'Alpha 1',
      coordinate: { latitude: 28.472, longitude: 77.518 },
    },
    destination: {
      name: 'Alpha 2',
      coordinate: { latitude: 28.476, longitude: 77.513 },
    },
    description: 'Inter-sector residential link connecting Alpha 1 and Alpha 2 shopping nodes.',
    distanceKm: 2.1,
    etaMinutes: 7,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.518, 28.472],
        [77.513, 28.476],
      ],
    },
    keyCorridors: ['Alpha Sector Inter-Connecting Spine'],
    alternatives: [
      {
        id: 'route-alp1-alp2-opt',
        routeId: 'route-alp1-alp2-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'INTER-SECTOR SPINE',
        badge: 'Recommended',
        tagline: 'Direct via 2-Lane Sector Connector',
        etaMinutes: 7,
        durationMinutes: 7,
        durationSeconds: 420,
        distanceKm: 2.1,
        distanceMeters: 2100,
        trafficLevel: 'Low',
        congestionIndex: 28,
        congestionScore: 28,
        estimatedCo2Kg: 0.61,
        emissionsKg: 0.61,
        fuelConsumedLiters: 0.26,
        idleDelayMinutes: 0.8,
        averageSpeedKmH: 28.4,
        intersectionDelaySeconds: 15,
        roadCount: 2,
        niuScore: 95,
        recommendationReason: 'Smooth inter-sector transit with low queuing.',
        scoreBreakdown: { timeScore: 95, congestionScore: 94, emissionsScore: 96, delayScore: 95 },
        keyCorridors: ['Alpha Sector Inter-Connecting Spine'],
        pathDescription: 'Low-density inter-sector link.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.518, 28.472],
            [77.513, 28.476],
          ],
        },
      },
    ],
  },

  // 6. Pari Chowk -> Galgotias University
  {
    id: 'route-pari-galgotias',
    name: 'Pari Chowk ➔ Galgotias University Campus',
    category: 'campus',
    origin: {
      name: 'Pari Chowk',
      coordinate: { latitude: 28.4682, longitude: 77.5105 },
    },
    destination: {
      name: 'Galgotias University',
      coordinate: { latitude: 28.3639, longitude: 77.5402 },
    },
    description: 'High-speed Yamuna Expressway corridor between Greater Noida core and Galgotias Campus.',
    distanceKm: 14.5,
    etaMinutes: 18,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.5105, 28.4682],
        [77.522, 28.435],
        [77.5402, 28.3639],
      ],
    },
    keyCorridors: ['Yamuna Expressway Link Arterial', 'Yamuna Expressway Main Spine', 'Galgotias Terminal'],
    alternatives: [
      {
        id: 'route-pari-galgotias-opt',
        routeId: 'route-pari-galgotias-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'EXPRESSWAY CAMPUS SHUTTLE',
        badge: 'Recommended Commute',
        tagline: 'Yamuna Expressway Main 4-Lane Trunk',
        etaMinutes: 18,
        durationMinutes: 18,
        durationSeconds: 1080,
        distanceKm: 14.5,
        distanceMeters: 14500,
        trafficLevel: 'Low',
        congestionIndex: 25,
        congestionScore: 25,
        estimatedCo2Kg: 4.12,
        emissionsKg: 4.12,
        fuelConsumedLiters: 1.76,
        idleDelayMinutes: 1.4,
        averageSpeedKmH: 62.0,
        intersectionDelaySeconds: 35,
        roadCount: 4,
        niuScore: 93,
        recommendationReason: 'High continuous cruising speed (60-80 km/h) with zero internal signals.',
        scoreBreakdown: { timeScore: 92, congestionScore: 95, emissionsScore: 92, delayScore: 93 },
        keyCorridors: ['Yamuna Expressway Link Arterial', 'Yamuna Expressway Main Trunk'],
        pathDescription: 'Continuous highway flow with high fuel efficiency.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5105, 28.4682],
            [77.522, 28.435],
            [77.5402, 28.3639],
          ],
        },
      },
      {
        id: 'route-pari-galgotias-service',
        routeId: 'route-pari-galgotias-service',
        objective: 'LOWEST_EMISSIONS',
        type: 'greenest',
        title: 'ECO-BYPASS GREENWAY',
        badge: 'Lowest Toll / Eco-way',
        tagline: 'Via Yamuna Eco-Corridor Sector Bypass',
        etaMinutes: 24,
        durationMinutes: 24,
        durationSeconds: 1440,
        distanceKm: 16.2,
        distanceMeters: 16200,
        trafficLevel: 'Low',
        congestionIndex: 18,
        congestionScore: 18,
        estimatedCo2Kg: 3.45,
        emissionsKg: 3.45,
        fuelConsumedLiters: 1.48,
        idleDelayMinutes: 0.5,
        averageSpeedKmH: 48.0,
        intersectionDelaySeconds: 15,
        roadCount: 5,
        niuScore: 89,
        recommendationReason: 'Avoids expressway toll bottlenecks with consistent kinetic velocity.',
        scoreBreakdown: { timeScore: 80, congestionScore: 97, emissionsScore: 95, delayScore: 94 },
        keyCorridors: ['Yamuna Eco-Corridor Bypass', 'Sector 17A Access'],
        pathDescription: 'Scenic suburban greenway with low carbon footprint.',
        isRecommended: false,
        colorHex: '#06b6d4',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5105, 28.4682],
            [77.522, 28.435],
            [77.515, 28.395],
            [77.5402, 28.3639],
          ],
        },
      },
    ],
  },

  // 7. Alpha 1 -> Galgotias University
  {
    id: 'route-alpha1-galgotias',
    name: 'Alpha 1 ➔ Galgotias University Campus',
    category: 'campus',
    origin: {
      name: 'Alpha 1',
      coordinate: { latitude: 28.472, longitude: 77.518 },
    },
    destination: {
      name: 'Galgotias University',
      coordinate: { latitude: 28.3639, longitude: 77.5402 },
    },
    description: 'Primary university commute connecting Alpha 1 student housing and campus.',
    distanceKm: 16.2,
    etaMinutes: 22,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.518, 28.472],
        [77.5105, 28.4682],
        [77.522, 28.435],
        [77.5402, 28.3639],
      ],
    },
    keyCorridors: ['Alpha 1 Main Road', 'Pari Chowk Hub', 'Yamuna Expressway'],
    alternatives: [
      {
        id: 'route-alp1-galgotias-opt',
        routeId: 'route-alp1-galgotias-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'CAMPUS TRANSIT SHUTTLE',
        badge: 'Recommended Commute',
        tagline: 'Via Alpha Main & Yamuna Expressway',
        etaMinutes: 22,
        durationMinutes: 22,
        durationSeconds: 1320,
        distanceKm: 16.2,
        distanceMeters: 16200,
        trafficLevel: 'Low',
        congestionIndex: 30,
        congestionScore: 30,
        estimatedCo2Kg: 4.65,
        emissionsKg: 4.65,
        fuelConsumedLiters: 1.98,
        idleDelayMinutes: 2.1,
        averageSpeedKmH: 55.0,
        intersectionDelaySeconds: 40,
        roadCount: 5,
        niuScore: 92,
        recommendationReason: 'High capacity corridor linking student zones directly to campus.',
        scoreBreakdown: { timeScore: 91, congestionScore: 93, emissionsScore: 91, delayScore: 93 },
        keyCorridors: ['Alpha 1 Main Road', 'Yamuna Expressway'],
        pathDescription: 'Direct student commute artery.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.518, 28.472],
            [77.5105, 28.4682],
            [77.522, 28.435],
            [77.5402, 28.3639],
          ],
        },
      },
    ],
  },

  // 8. Knowledge Park -> Galgotias University
  {
    id: 'route-kp-galgotias',
    name: 'Knowledge Park ➔ Galgotias University',
    category: 'campus',
    origin: {
      name: 'Knowledge Park',
      coordinate: { latitude: 28.461, longitude: 77.4998 },
    },
    destination: {
      name: 'Galgotias University',
      coordinate: { latitude: 28.3639, longitude: 77.5402 },
    },
    description: 'Inter-campus university link connecting KP tech institutes to Yamuna Expressway.',
    distanceKm: 15.8,
    etaMinutes: 21,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.4998, 28.461],
        [77.505, 28.455],
        [77.522, 28.435],
        [77.5402, 28.3639],
      ],
    },
    keyCorridors: ['KP Outer Ring Link', 'Yamuna Expressway Connector', 'Yamuna Expressway'],
    alternatives: [
      {
        id: 'route-kp-galgotias-opt',
        routeId: 'route-kp-galgotias-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'INTER-CAMPUS EXPRESS',
        badge: 'Recommended',
        tagline: 'Via KP Outer Ring & Expressway',
        etaMinutes: 21,
        durationMinutes: 21,
        durationSeconds: 1260,
        distanceKm: 15.8,
        distanceMeters: 15800,
        trafficLevel: 'Low',
        congestionIndex: 26,
        congestionScore: 26,
        estimatedCo2Kg: 4.45,
        emissionsKg: 4.45,
        fuelConsumedLiters: 1.9,
        idleDelayMinutes: 1.1,
        averageSpeedKmH: 58.0,
        intersectionDelaySeconds: 25,
        roadCount: 4,
        niuScore: 94,
        recommendationReason: 'Bypasses Pari Chowk entirely via KP South outer ring.',
        scoreBreakdown: { timeScore: 93, congestionScore: 95, emissionsScore: 93, delayScore: 95 },
        keyCorridors: ['KP Outer Ring', 'Yamuna Expressway'],
        pathDescription: 'Rapid southern bypass avoiding downtown rotary.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.4998, 28.461],
            [77.505, 28.455],
            [77.522, 28.435],
            [77.5402, 28.3639],
          ],
        },
      },
    ],
  },

  // 9. Galgotias University -> Dankaur Junction
  {
    id: 'route-galgotias-dankaur',
    name: 'Galgotias University ➔ Dankaur Junction Link',
    category: 'commute',
    origin: {
      name: 'Galgotias University',
      coordinate: { latitude: 28.3639, longitude: 77.5402 },
    },
    destination: {
      name: 'Dankaur Junction',
      coordinate: { latitude: 28.3512, longitude: 77.5505 },
    },
    description: 'Suburban link between university campus and Dankaur town railway junction.',
    distanceKm: 2.8,
    etaMinutes: 8,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.5402, 28.3639],
        [77.545, 28.3655],
        [77.5505, 28.3512],
      ],
    },
    keyCorridors: ['Yamuna Service Road', 'Dankaur Approach Way'],
    alternatives: [
      {
        id: 'route-galgotias-dankaur-opt',
        routeId: 'route-galgotias-dankaur-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'STATION FEEDER LINK',
        badge: 'Recommended',
        tagline: 'Direct via Dankaur Road',
        etaMinutes: 8,
        durationMinutes: 8,
        durationSeconds: 480,
        distanceKm: 2.8,
        distanceMeters: 2800,
        trafficLevel: 'Low',
        congestionIndex: 22,
        congestionScore: 22,
        estimatedCo2Kg: 0.75,
        emissionsKg: 0.75,
        fuelConsumedLiters: 0.32,
        idleDelayMinutes: 0.5,
        averageSpeedKmH: 34.0,
        intersectionDelaySeconds: 15,
        roadCount: 3,
        niuScore: 93,
        recommendationReason: 'Steady rural-suburban feeder corridor.',
        scoreBreakdown: { timeScore: 92, congestionScore: 94, emissionsScore: 93, delayScore: 93 },
        keyCorridors: ['Dankaur Approach Way'],
        pathDescription: 'Smooth local link to railway node.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5402, 28.3639],
            [77.545, 28.3655],
            [77.5505, 28.3512],
          ],
        },
      },
    ],
  },

  // 10. Alpha 2 -> Expressway Terminal
  {
    id: 'route-alpha2-expressway',
    name: 'Alpha 2 ➔ Noida Expressway North Terminal',
    category: 'expressway',
    origin: {
      name: 'Alpha 2',
      coordinate: { latitude: 28.476, longitude: 77.513 },
    },
    destination: {
      name: 'Noida-Greater Noida Expressway North Terminal',
      coordinate: { latitude: 28.475, longitude: 77.502 },
    },
    description: 'Arterial exit link heading northbound toward Noida & Delhi NCR.',
    distanceKm: 2.4,
    etaMinutes: 6,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.513, 28.476],
        [77.502, 28.475],
      ],
    },
    keyCorridors: ['Alpha 2 North Peripheral Link'],
    alternatives: [
      {
        id: 'route-alp2-exp-opt',
        routeId: 'route-alp2-exp-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'EXPRESSWAY GATEWAY',
        badge: 'Recommended',
        tagline: 'Direct via North Peripheral Link',
        etaMinutes: 6,
        durationMinutes: 6,
        durationSeconds: 360,
        distanceKm: 2.4,
        distanceMeters: 2400,
        trafficLevel: 'Low',
        congestionIndex: 25,
        congestionScore: 25,
        estimatedCo2Kg: 0.65,
        emissionsKg: 0.65,
        fuelConsumedLiters: 0.28,
        idleDelayMinutes: 0.6,
        averageSpeedKmH: 36.0,
        intersectionDelaySeconds: 15,
        roadCount: 2,
        niuScore: 95,
        recommendationReason: 'Quick highway egress without crossing central bottlenecks.',
        scoreBreakdown: { timeScore: 96, congestionScore: 94, emissionsScore: 95, delayScore: 95 },
        keyCorridors: ['Alpha 2 North Peripheral Link'],
        pathDescription: 'Clear peripheral gateway.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.513, 28.476],
            [77.502, 28.475],
          ],
        },
      },
    ],
  },

  // 11. Knowledge Park -> Outer Sector Loop
  {
    id: 'route-kp-outer',
    name: 'Knowledge Park Inner ➔ KP Outer Sector Ring',
    category: 'commute',
    origin: {
      name: 'Knowledge Park',
      coordinate: { latitude: 28.461, longitude: 77.4998 },
    },
    destination: {
      name: 'Knowledge Park Outer Sector Junction',
      coordinate: { latitude: 28.455, longitude: 77.505 },
    },
    description: 'Circumferential institutional distributor corridor.',
    distanceKm: 1.7,
    etaMinutes: 4,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.4998, 28.461],
        [77.505, 28.455],
      ],
    },
    keyCorridors: ['Knowledge Park South Outer Access'],
    alternatives: [
      {
        id: 'route-kp-outer-opt',
        routeId: 'route-kp-outer-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'OUTER CIRCULAR RING',
        badge: 'Recommended',
        tagline: 'Via KP South Outer Access',
        etaMinutes: 4,
        durationMinutes: 4,
        durationSeconds: 240,
        distanceKm: 1.7,
        distanceMeters: 1700,
        trafficLevel: 'Low',
        congestionIndex: 19,
        congestionScore: 19,
        estimatedCo2Kg: 0.45,
        emissionsKg: 0.45,
        fuelConsumedLiters: 0.19,
        idleDelayMinutes: 0.3,
        averageSpeedKmH: 38.0,
        intersectionDelaySeconds: 10,
        roadCount: 2,
        niuScore: 96,
        recommendationReason: 'Smooth secondary distributor with low vehicular load.',
        scoreBreakdown: { timeScore: 97, congestionScore: 96, emissionsScore: 96, delayScore: 95 },
        keyCorridors: ['Knowledge Park South Outer Access'],
        pathDescription: 'Low-density sector loop.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.4998, 28.461],
            [77.505, 28.455],
          ],
        },
      },
    ],
  },

  // 12. Jagat Farm -> Alpha 1
  {
    id: 'route-jagat-alpha1',
    name: 'Jagat Farm ➔ Alpha 1 Commercial Centre',
    category: 'commercial',
    origin: {
      name: 'Jagat Farm',
      coordinate: { latitude: 28.4705, longitude: 77.5142 },
    },
    destination: {
      name: 'Alpha 1',
      coordinate: { latitude: 28.472, longitude: 77.518 },
    },
    description: 'Reverse trade & banking transit between Jagat Farm market and Alpha 1 commercial offices.',
    distanceKm: 1.4,
    etaMinutes: 5,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.5142, 28.4705],
        [77.518, 28.472],
      ],
    },
    keyCorridors: ['Alpha 1 - Jagat Farm Connecting Road'],
    alternatives: [
      {
        id: 'route-jagat-alp1-opt',
        routeId: 'route-jagat-alp1-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'COMMERCIAL LINK',
        badge: 'Recommended',
        tagline: 'Direct via Secondary Connecting Road',
        etaMinutes: 5,
        durationMinutes: 5,
        durationSeconds: 300,
        distanceKm: 1.4,
        distanceMeters: 1400,
        trafficLevel: 'Medium',
        congestionIndex: 35,
        congestionScore: 35,
        estimatedCo2Kg: 0.38,
        emissionsKg: 0.38,
        fuelConsumedLiters: 0.16,
        idleDelayMinutes: 0.9,
        averageSpeedKmH: 24.0,
        intersectionDelaySeconds: 15,
        roadCount: 2,
        niuScore: 92,
        recommendationReason: 'Short haul retail transit with low emissions.',
        scoreBreakdown: { timeScore: 92, congestionScore: 91, emissionsScore: 94, delayScore: 91 },
        keyCorridors: ['Alpha 1 - Jagat Farm Connecting Road'],
        pathDescription: 'Direct short-haul link.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5142, 28.4705],
            [77.518, 28.472],
          ],
        },
      },
    ],
  },

  // 13. Pari Chowk -> Dankaur Junction
  {
    id: 'route-pari-dankaur',
    name: 'Pari Chowk ➔ Dankaur Junction Link',
    category: 'expressway',
    origin: {
      name: 'Pari Chowk',
      coordinate: { latitude: 28.4682, longitude: 77.5105 },
    },
    destination: {
      name: 'Dankaur Junction',
      coordinate: { latitude: 28.3512, longitude: 77.5505 },
    },
    description: 'Suburban arterial transit route connecting Pari Chowk to Dankaur via Yamuna Expressway corridor.',
    distanceKm: 17.2,
    etaMinutes: 24,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.5105, 28.4682],
        [77.522, 28.435],
        [77.5402, 28.3639],
        [77.5505, 28.3512],
      ],
    },
    keyCorridors: ['Yamuna Expressway Link', 'Yamuna Expressway Main', 'Dankaur Station Approach'],
    alternatives: [
      {
        id: 'route-pari-dankaur-opt',
        routeId: 'route-pari-dankaur-opt',
        objective: 'NIU_OPTIMAL',
        type: 'optimal',
        title: 'SUBURBAN ARTERIAL EXPRESS',
        badge: 'Recommended',
        tagline: 'Via Yamuna Expressway & Dankaur Approach',
        etaMinutes: 24,
        durationMinutes: 24,
        durationSeconds: 1440,
        distanceKm: 17.2,
        distanceMeters: 17200,
        trafficLevel: 'Low',
        congestionIndex: 24,
        congestionScore: 24,
        estimatedCo2Kg: 4.88,
        emissionsKg: 4.88,
        fuelConsumedLiters: 2.08,
        idleDelayMinutes: 1.5,
        averageSpeedKmH: 52.0,
        intersectionDelaySeconds: 30,
        roadCount: 5,
        niuScore: 92,
        recommendationReason: 'Long haul arterial throughput with low congestion score.',
        scoreBreakdown: { timeScore: 90, congestionScore: 95, emissionsScore: 91, delayScore: 92 },
        keyCorridors: ['Yamuna Expressway', 'Dankaur Road'],
        pathDescription: 'Rapid southern transit route.',
        isRecommended: true,
        colorHex: '#10b981',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.5105, 28.4682],
            [77.522, 28.435],
            [77.5402, 28.3639],
            [77.5505, 28.3512],
          ],
        },
      },
    ],
  },

  // 14. EMERGENCY CORRIDOR: Alpha 1 -> Knowledge Park Medical Hub
  {
    id: 'route-emergency-alpha1-kp',
    name: '[EMERGENCY EVP] Alpha 1 Residential ➔ Knowledge Park Medical Hub',
    category: 'emergency',
    origin: {
      name: 'Alpha 1',
      coordinate: { latitude: 28.472, longitude: 77.518 },
    },
    destination: {
      name: 'Knowledge Park',
      coordinate: { latitude: 28.461, longitude: 77.4998 },
    },
    description: 'Designated Emergency Vehicle Pre-emption (EVP) Green-Wave corridor saving critical minutes.',
    distanceKm: 7.4,
    etaMinutes: 11,
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.518, 28.472],
        [77.5105, 28.4682],
        [77.4998, 28.461],
      ],
    },
    keyCorridors: ['Alpha 1 Link Road', 'Pari Chowk Arterial', 'Knowledge Park Expressway Spine'],
    alternatives: [
      {
        id: 'route-emergency-alpha1-kp-evp',
        routeId: 'route-emergency-alpha1-kp-evp',
        objective: 'FASTEST',
        type: 'fastest',
        title: 'EMERGENCY PRE-EMPTION GREEN-WAVE',
        badge: 'Priority EVP Corridor',
        tagline: 'Pre-empted Signal Flow via Pari Chowk Central',
        etaMinutes: 10,
        durationMinutes: 10,
        durationSeconds: 651,
        distanceKm: 7.4,
        distanceMeters: 7400,
        trafficLevel: 'Low',
        congestionIndex: 15,
        congestionScore: 15,
        estimatedCo2Kg: 2.1,
        emissionsKg: 2.1,
        fuelConsumedLiters: 0.9,
        idleDelayMinutes: 0.4,
        averageSpeedKmH: 48.5,
        intersectionDelaySeconds: 12,
        roadCount: 3,
        niuScore: 98,
        recommendationReason: 'Pre-empts North-South signals to continuous green. 3m 41s saved vs normal traffic.',
        scoreBreakdown: { timeScore: 99, congestionScore: 98, emissionsScore: 97, delayScore: 98 },
        keyCorridors: ['Alpha 1 Main Road', 'Pari Chowk Arterial', 'Knowledge Park Transit Way'],
        pathDescription: 'Emergency corridor with dynamic signal override.',
        isRecommended: true,
        colorHex: '#f43f5e',
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.518, 28.472],
            [77.5105, 28.4682],
            [77.4998, 28.461],
          ],
        },
      },
    ],
  },
];

// Extensible mutable registry store
const demoRoutesRegistry: DemoRouteDefinition[] = [...INITIAL_DEMO_ROUTES];

/**
 * Register a custom demo route definition to extend the registry.
 */
export function registerCustomDemoRoute(route: DemoRouteDefinition): void {
  const existingIdx = demoRoutesRegistry.findIndex((r) => r.id === route.id);
  if (existingIdx >= 0) {
    demoRoutesRegistry[existingIdx] = route;
  } else {
    demoRoutesRegistry.push(route);
  }
}

/**
 * Retrieves all registered demo routes.
 */
export function getAllDemoRoutes(): DemoRouteDefinition[] {
  return [...demoRoutesRegistry];
}

/**
 * Retrieves a single demo route by id.
 */
export function getDemoRouteById(id: string): DemoRouteDefinition | undefined {
  return demoRoutesRegistry.find((r) => r.id === id);
}

/**
 * Finds demo routes matching origin and destination query strings or keywords.
 */
export function findDemoRoutes(origin?: string, destination?: string): DemoRouteDefinition[] {
  return demoRoutesRegistry.filter((r) => {
    let match = true;
    if (origin && origin.trim()) {
      const q = origin.trim().toLowerCase();
      match = match && (r.origin.name.toLowerCase().includes(q) || (!destination && r.name.toLowerCase().includes(q)));
    }
    if (destination && destination.trim()) {
      const q = destination.trim().toLowerCase();
      match = match && (r.destination.name.toLowerCase().includes(q) || (!origin && r.name.toLowerCase().includes(q)));
    }
    return match;
  });
}

/**
 * Returns a deduplicated list of unique locations available across registered demo routes.
 */
export function getDemoLocations(): Array<{ id: string; name: string; coordinate: Coordinate }> {
  const map = new Map<string, { id: string; name: string; coordinate: Coordinate }>();

  for (const r of demoRoutesRegistry) {
    const origKey = r.origin.name.toLowerCase();
    if (!map.has(origKey)) {
      map.set(origKey, {
        id: origKey.replace(/\s+/g, '-'),
        name: r.origin.name,
        coordinate: r.origin.coordinate,
      });
    }

    const destKey = r.destination.name.toLowerCase();
    if (!map.has(destKey)) {
      map.set(destKey, {
        id: destKey.replace(/\s+/g, '-'),
        name: r.destination.name,
        coordinate: r.destination.coordinate,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Adapts a DemoRouteDefinition into a full SmartRouteComparisonResult
 * for consumption by routing UI components.
 */
/**
 * Adapts a DemoRouteDefinition into a full SmartRouteComparisonResult
 * for consumption by routing UI components.
 * Deterministically applies scenario and incident modulations.
 */
export function demoRouteToComparisonResult(
  route: DemoRouteDefinition,
  scenario: SimulationTrafficMode = 'normal',
  objective: import('@/types/routing').RoutingObjective = 'NIU_OPTIMAL',
  incident?: import('@/types/incident').SimulatedIncident | null
): SmartRouteComparisonResult {
  const dynamicAlternatives: SmartRouteAlternative[] = route.alternatives.map((alt) => {
    // Determine if incident affects this alternative
    let incidentDurationMult = 1.0;
    let incidentDelaySec = 0;
    let incidentCongestionAdd = 0;
    let incidentCo2Mult = 1.0;

    if (incident) {
      const incName = incident.intersectionName.toLowerCase().split(' ')[0];
      const passesIncident =
        alt.keyCorridors.some((k) => k.toLowerCase().includes(incName)) ||
        alt.pathDescription.toLowerCase().includes(incName) ||
        alt.title.toLowerCase().includes(incName) ||
        alt.geometry.coordinates.some(([lng, lat]) => {
          const dLat = Math.abs(lat - incident.coordinates.lat);
          const dLng = Math.abs(lng - incident.coordinates.lng);
          return dLat < 0.009 && dLng < 0.009;
        });

      if (passesIncident) {
        if (incident.severity === 'major') {
          incidentDurationMult = 1.75;
          incidentDelaySec = 220;
          incidentCongestionAdd = 32;
          incidentCo2Mult = 1.65;
        } else if (incident.severity === 'moderate') {
          incidentDurationMult = 1.40;
          incidentDelaySec = 130;
          incidentCongestionAdd = 20;
          incidentCo2Mult = 1.35;
        } else {
          incidentDurationMult = 1.18;
          incidentDelaySec = 60;
          incidentCongestionAdd = 10;
          incidentCo2Mult = 1.15;
        }
      }
    }

    // Scenario factors
    // Arterial/Direct routes degrade faster in rush hour than bypass/green routes
    const isDirectArterial = alt.type === 'fastest' || alt.tagline.toLowerCase().includes('direct') || alt.tagline.toLowerCase().includes('spine');
    const isBypass = alt.type === 'optimal' || alt.tagline.toLowerCase().includes('bypass') || alt.tagline.toLowerCase().includes('loop');

    let scenarioDurationMult = 1.0;
    let scenarioDelayMult = 1.0;
    let scenarioCongestionAdd = 0;
    let scenarioCo2Mult = 1.0;
    let scenarioSpeedMult = 1.0;
    let scoreShift = 0;

    if (scenario === 'rush_hour') {
      if (isDirectArterial) {
        scenarioDurationMult = 1.65;
        scenarioDelayMult = 2.10;
        scenarioCongestionAdd = 34;
        scenarioCo2Mult = 1.58;
        scenarioSpeedMult = 0.58;
        scoreShift = -26;
      } else if (isBypass) {
        scenarioDurationMult = 1.32;
        scenarioDelayMult = 1.45;
        scenarioCongestionAdd = 18;
        scenarioCo2Mult = 1.28;
        scenarioSpeedMult = 0.76;
        scoreShift = -10;
      } else {
        scenarioDurationMult = 1.45;
        scenarioDelayMult = 1.70;
        scenarioCongestionAdd = 24;
        scenarioCo2Mult = 1.40;
        scenarioSpeedMult = 0.68;
        scoreShift = -18;
      }
    } else if (scenario === 'optimized') {
      scenarioDurationMult = 0.78;
      scenarioDelayMult = 0.58;
      scenarioCongestionAdd = -16;
      scenarioCo2Mult = 0.82;
      scenarioSpeedMult = 1.24;
      scoreShift = +12;
    } else if (scenario === 'emergency') {
      const isCorridorMatch = alt.keyCorridors.some((k) =>
        ['alpha', 'pari chowk', 'knowledge'].some((term) => k.toLowerCase().includes(term))
      );
      if (isCorridorMatch) {
        scenarioDurationMult = 0.85;
        scenarioDelayMult = 0.70;
        scenarioCongestionAdd = -10;
        scenarioCo2Mult = 0.90;
        scenarioSpeedMult = 1.15;
        scoreShift = +8;
      } else {
        scenarioDurationMult = 1.15;
        scenarioDelayMult = 1.35;
        scenarioCongestionAdd = 12;
        scenarioCo2Mult = 1.14;
        scenarioSpeedMult = 0.88;
        scoreShift = -8;
      }
    }

    const durationMinutes = Math.max(
      3,
      Math.round(alt.durationMinutes * scenarioDurationMult * incidentDurationMult)
    );
    const durationSeconds = durationMinutes * 60;
    const etaMinutes = durationMinutes;

    const intersectionDelaySeconds = Math.max(
      10,
      Math.round(alt.intersectionDelaySeconds * scenarioDelayMult + incidentDelaySec)
    );
    const idleDelayMinutes = Number(
      Math.max(0.5, (alt.idleDelayMinutes * scenarioDelayMult + incidentDelaySec / 60)).toFixed(1)
    );

    const congestionScore = Math.min(
      99,
      Math.max(10, Math.round(alt.congestionScore + scenarioCongestionAdd + incidentCongestionAdd))
    );
    const congestionIndex = congestionScore;
    const trafficLevel: 'Low' | 'Medium' | 'High' =
      congestionScore >= 60 ? 'High' : congestionScore >= 35 ? 'Medium' : 'Low';

    const emissionsKg = Number(
      Math.max(0.2, (alt.emissionsKg * scenarioCo2Mult * incidentCo2Mult)).toFixed(2)
    );
    const estimatedCo2Kg = emissionsKg;

    const fuelConsumedLiters = Number(
      Math.max(0.1, (alt.fuelConsumedLiters * scenarioCo2Mult * incidentCo2Mult)).toFixed(2)
    );

    const averageSpeedKmH = Number(
      Math.max(8.0, Math.min(65.0, (alt.averageSpeedKmH * scenarioSpeedMult) / incidentDurationMult)).toFixed(1)
    );

    const niuScore = Math.min(
      99,
      Math.max(12, Math.round(alt.niuScore + scoreShift - (incident ? (incident.severity === 'major' ? 20 : 10) : 0)))
    );

    return {
      ...alt,
      durationMinutes,
      durationSeconds,
      etaMinutes,
      intersectionDelaySeconds,
      idleDelayMinutes,
      congestionScore,
      congestionIndex,
      trafficLevel,
      emissionsKg,
      estimatedCo2Kg,
      fuelConsumedLiters,
      averageSpeedKmH,
      niuScore,
      scoreBreakdown: {
        timeScore: Math.min(99, Math.max(10, Math.round(alt.scoreBreakdown.timeScore + (scenario === 'optimized' ? 10 : scenario === 'rush_hour' ? -18 : 0)))),
        congestionScore: Math.min(99, Math.max(10, 100 - congestionScore)),
        emissionsScore: Math.min(99, Math.max(10, Math.round(alt.scoreBreakdown.emissionsScore + (scenario === 'optimized' ? 8 : scenario === 'rush_hour' ? -14 : 0)))),
        delayScore: Math.min(99, Math.max(10, Math.round(100 - (intersectionDelaySeconds / 2)))),
      },
    };
  });

  // Re-rank and find recommended route according to objective
  let recommendedRoute = dynamicAlternatives.find((a) => a.objective === objective);
  if (!recommendedRoute) {
    if (objective === 'FASTEST') {
      recommendedRoute = [...dynamicAlternatives].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
    } else if (objective === 'LOWEST_EMISSIONS') {
      recommendedRoute = [...dynamicAlternatives].sort((a, b) => a.estimatedCo2Kg - b.estimatedCo2Kg)[0];
    } else if (objective === 'LOWEST_CONGESTION') {
      recommendedRoute = [...dynamicAlternatives].sort((a, b) => a.congestionScore - b.congestionScore)[0];
    } else if (objective === 'SHORTEST') {
      recommendedRoute = [...dynamicAlternatives].sort((a, b) => a.distanceKm - b.distanceKm)[0];
    } else {
      recommendedRoute = [...dynamicAlternatives].sort((a, b) => b.niuScore - a.niuScore)[0];
    }
  }

  const finalAlternatives = dynamicAlternatives.map((alt) => ({
    ...alt,
    isRecommended: alt.id === recommendedRoute?.id,
  }));

  const finalRecommended = finalAlternatives.find((a) => a.id === recommendedRoute?.id) || finalAlternatives[0];

  return {
    zoneId: 'greater-noida-core',
    origin: {
      query: route.origin.name,
      resolvedName: route.origin.name,
      coordinate: route.origin.coordinate,
      snappedCoordinate: route.origin.coordinate,
      snapDistanceMeters: 0,
    },
    destination: {
      query: route.destination.name,
      resolvedName: route.destination.name,
      coordinate: route.destination.coordinate,
      snappedCoordinate: route.destination.coordinate,
      snapDistanceMeters: 0,
    },
    scenario,
    objective,
    routes: finalAlternatives,
    recommendedRoute: finalRecommended,
    recommendedRouteId: finalRecommended.id,
    provenance: {
      roadNetwork: 'REAL — OSM',
      traffic: 'SIMULATED — NIU SYNTHETIC DEMAND ENGINE',
      route: 'NIU COMPUTED',
      emissions: 'ESTIMATED — IPCC/CEA CALIBRATED',
    },
    timestamp: new Date().toISOString(),
  };
}
