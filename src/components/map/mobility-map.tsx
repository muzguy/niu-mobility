'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Map as MapLibreMap, Popup, AttributionControl, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useSimulation } from '@/context/simulation-context';
import { useTheme } from '@/context/theme-context';
import { apiGetZoneMapPayload } from '@/lib/api-client';
import { getMapStyle, isWebGLSupported } from '@/lib/map/map-styles';
import {
  roadsToGeoJSON,
  intersectionsToGeoJSON,
  generateSimulatedVehicles,
  generateRoutePulsePoint,
  buildEmergencyCorridorGeoJSON,
  routeEndpointsToGeoJSON,
  routesToGeoJSON,
} from '@/lib/map/geojson-converter';
import {
  getAllDemoRoutes,
  DemoRouteDefinition,
  demoRouteToComparisonResult,
} from '@/lib/routing/demo-routes-registry';
import { SEEDED_MOBILITY_ZONES } from '@/data/mobility-zones-seed';
import { MapControls } from './map-controls';
import { MapLegend } from './map-legend';
import { MapStatus } from './map-status';
import { MapLayerToggles, ZoneMapPayload } from '@/types/map';
import { SmartRouteAlternative, SmartRouteComparisonResult } from '@/types/routing';
import {
  AlertCircle,
  RefreshCw,
  Route as RouteIcon,
  X,
  Clock,
  Leaf,
  ShieldCheck,
  Siren,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

interface MobilityMapProps {
  activeZoneId?: string;
  onSelectIntersection?: (id: string) => void;
  onSelectRoute?: (routeId: string) => void;
  heightClass?: string;
  routesGeoJSON?: GeoJSON.FeatureCollection<GeoJSON.LineString> | null;
  selectedRouteId?: string | null;
  originPoint?: { coordinate: { latitude: number; longitude: number }; name?: string } | null;
  destinationPoint?: { coordinate: { latitude: number; longitude: number }; name?: string } | null;
  showDemoRoutePicker?: boolean;
}

export function MobilityMap({
  activeZoneId = 'greater-noida-core',
  onSelectIntersection,
  onSelectRoute,
  heightClass = 'h-[520px] sm:h-[600px]',
  routesGeoJSON = null,
  selectedRouteId = null,
  originPoint = null,
  destinationPoint = null,
  showDemoRoutePicker = true,
}: MobilityMapProps) {
  const { simulationMode, selectIntersection, emergencyCorridor } = useSimulation();
  const { isDark } = useTheme();

  const onSelectRouteRef = useRef(onSelectRoute);
  const onSelectIntersectionRef = useRef(onSelectIntersection);

  useEffect(() => {
    onSelectRouteRef.current = onSelectRoute;
    onSelectIntersectionRef.current = onSelectIntersection;
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  const selectedRouteCoordinatesRef = useRef<[number, number][] | null>(null);

  // Playback control
  const [isSimulating, setIsSimulating] = useState(true);

  // Demo Route Explorer state (when used standalone without external routesGeoJSON)
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const [demoRoutesList] = useState<DemoRouteDefinition[]>(() => getAllDemoRoutes());
  const [internalComparison, setInternalComparison] = useState<SmartRouteComparisonResult | null>(null);
  const [internalSelectedRouteId, setInternalSelectedRouteId] = useState<string | null>(null);

  // Resolved active routes & endpoints: prioritize external props over internal demo selection
  const activeSelectedRouteId = selectedRouteId || internalSelectedRouteId;
  const activeRoutesGeoJSON = React.useMemo(
    () => routesGeoJSON || (internalComparison ? routesToGeoJSON(internalComparison.routes) : null),
    [routesGeoJSON, internalComparison]
  );
  const activeOriginPoint = React.useMemo(
    () =>
      originPoint ||
      (internalComparison
        ? {
            coordinate: internalComparison.origin.snappedCoordinate,
            name: internalComparison.origin.resolvedName,
          }
        : null),
    [originPoint, internalComparison]
  );
  const activeDestinationPoint = React.useMemo(
    () =>
      destinationPoint ||
      (internalComparison
        ? {
            coordinate: internalComparison.destination.snappedCoordinate,
            name: internalComparison.destination.resolvedName,
          }
        : null),
    [destinationPoint, internalComparison]
  );

  const activeSelectedRouteAlt: SmartRouteAlternative | undefined =
    internalComparison?.routes.find((r) => r.id === activeSelectedRouteId) ||
    internalComparison?.recommendedRoute ||
    internalComparison?.routes[0];

  // Client hydration & WebGL capability check
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const webGLAvailable = useSyncExternalStore(
    () => () => {},
    () => isWebGLSupported(),
    () => true
  );

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapPayload, setMapPayload] = useState<ZoneMapPayload | null>(() => {
    const seed = SEEDED_MOBILITY_ZONES.find((z) => z.id === activeZoneId) || SEEDED_MOBILITY_ZONES[0];
    return {
      zoneId: seed.id,
      zoneName: seed.name,
      center: [seed.center.longitude, seed.center.latitude],
      radiusMeters: seed.radiusMeters,
      boundingBox: seed.boundingBox,
      roadNetwork: roadsToGeoJSON(seed.roads, simulationMode as SimulationTrafficMode),
      intersections: intersectionsToGeoJSON(seed.intersections),
      dataAvailability: seed.dataAvailability,
      provenance: seed.provenance,
      lastSimulatedAt: new Date().toISOString(),
    };
  });
  const [loadingPayload, setLoadingPayload] = useState(false);

  const [layers, setLayers] = useState<MapLayerToggles>({
    showTraffic: true,
    showIntersections: true,
    showEmergency: true,
    showVehicles: true,
  });

  // Load payload asynchronously when zone or simulation mode changes
  useEffect(() => {
    let isMounted = true;

    async function loadZoneData() {
      try {
        const res = await apiGetZoneMapPayload(activeZoneId, simulationMode);
        if (isMounted && res.success && res.data) {
          setMapPayload(res.data);
          setLoadingPayload(false);
          return;
        }
      } catch {
        // Fallback to local calibrated seed
      }

      if (!isMounted) return;
      const seed = SEEDED_MOBILITY_ZONES.find((z) => z.id === activeZoneId) || SEEDED_MOBILITY_ZONES[0];
      const fallbackPayload: ZoneMapPayload = {
        zoneId: seed.id,
        zoneName: seed.name,
        center: [seed.center.longitude, seed.center.latitude],
        radiusMeters: seed.radiusMeters,
        boundingBox: seed.boundingBox,
        roadNetwork: roadsToGeoJSON(seed.roads, simulationMode as SimulationTrafficMode),
        intersections: intersectionsToGeoJSON(seed.intersections),
        dataAvailability: seed.dataAvailability,
        provenance: seed.provenance,
        lastSimulatedAt: new Date().toISOString(),
      };
      setMapPayload(fallbackPayload);
      setLoadingPayload(false);
    }

    loadZoneData();

    return () => {
      isMounted = false;
    };
  }, [activeZoneId, simulationMode]);

  // Initialize MapLibre GL Instance
  useEffect(() => {
    if (!isClient || !webGLAvailable || !mapContainerRef.current) return;
    if (mapRef.current) return; // Prevent double instantiation

    const initialStyle = getMapStyle(isDark);

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [77.5105, 28.4682], // Default Greater Noida Core
      zoom: 13.5,
      pitch: 20,
      bearing: 0,
      attributionControl: false,
    });

    map.on('error', (event) => {
      const err = event?.error;
      const rawUrl =
        typeof err === 'object' && err !== null && 'url' in err
          ? String((err as { url?: string }).url)
          : '';

      if (rawUrl && (rawUrl.includes('tile.openstreetmap.org') || rawUrl.includes('cartocdn.com'))) {
        return;
      }
    });

    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);

      // 1. Road Network Sources & Layers
      map.addSource('roads-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Base Asphalt Casing Layer
      map.addLayer({
        id: 'road-base',
        type: 'line',
        source: 'roads-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': isDark ? '#111827' : '#cbd5e1',
          'line-width': ['interpolate', ['linear'], ['zoom'], 11, 3, 14, 8, 17, 14],
        },
      });

      // Traffic Overlay Colored Layer
      map.addLayer({
        id: 'road-traffic',
        type: 'line',
        source: 'roads-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2, 14, 5, 17, 9],
          'line-opacity': 0.9,
        },
      });

      // Emergency Pre-emption Corridor Highlight Layer
      map.addLayer({
        id: 'road-emergency-glow',
        type: 'line',
        source: 'roads-source',
        filter: ['==', ['get', 'isEmergencyCorridor'], true],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#f43f5e',
          'line-width': ['interpolate', ['linear'], ['zoom'], 11, 5, 14, 12, 17, 18],
          'line-opacity': 0.75,
          'line-blur': 3,
        },
      });

      // 2. Emergency Priority Corridor Source & Layers
      map.addSource('emergency-corridor-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'emergency-corridor-glow',
        type: 'line',
        source: 'emergency-corridor-source',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#f43f5e',
          'line-width': 12,
          'line-opacity': 0.65,
          'line-blur': 4,
        },
      });

      map.addLayer({
        id: 'emergency-corridor-line',
        type: 'line',
        source: 'emergency-corridor-source',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#f43f5e',
          'line-width': 5,
          'line-opacity': 0.95,
          'line-dasharray': [4, 2],
        },
      });

      // 3. Intersections Source & Layers
      map.addSource('intersections-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Outer Halo Circle
      map.addLayer({
        id: 'intersections-glow',
        type: 'circle',
        source: 'intersections-source',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 6, 14, 12, 17, 16],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.35,
        },
      });

      // Core Junction Circle
      map.addLayer({
        id: 'intersections-point',
        type: 'circle',
        source: 'intersections-source',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3.5, 14, 7, 17, 10],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': isDark ? '#ffffff' : '#0f172a',
        },
      });

      // Junction Label
      map.addLayer({
        id: 'intersections-labels',
        type: 'symbol',
        source: 'intersections-source',
        layout: {
          'text-field': ['get', 'shortName'],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-font': ['Open Sans Semibold'],
        },
        paint: {
          'text-color': isDark ? '#f8fafc' : '#0f172a',
          'text-halo-color': isDark ? '#090d16' : '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      // 4. Routes GeoJSON Source & Polyline Layers
      map.addSource('routes-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Alternative routes (unselected): subtle casing and dashed stroke
      map.addLayer({
        id: 'routes-alternatives-casing',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': isDark ? '#020617' : '#ffffff',
          'line-width': 5,
          'line-opacity': 0.4,
        },
      });

      map.addLayer({
        id: 'routes-alternatives-line',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'colorHex'], '#64748b'],
          'line-width': 3.5,
          'line-opacity': 0.6,
          'line-dasharray': [3, 2],
        },
      });

      // Selected Route: Glowing underlay
      map.addLayer({
        id: 'selected-route-glow',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 14,
          'line-opacity': 0.55,
          'line-blur': 3,
        },
      });

      // Selected Route: Bold high-contrast casing
      map.addLayer({
        id: 'selected-route-casing',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': isDark ? '#020617' : '#ffffff',
          'line-width': 8.5,
          'line-opacity': 0.95,
        },
      });

      // Selected Route: Solid primary prominent line
      map.addLayer({
        id: 'selected-route-line',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 5.5,
          'line-opacity': 1.0,
        },
      });

      // 5. Selected Route Transit Pulse Source & Layers
      map.addSource('route-pulse-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'route-pulse-glow',
        type: 'circle',
        source: 'route-pulse-source',
        paint: {
          'circle-radius': 13,
          'circle-color': '#34d399',
          'circle-opacity': 0.6,
          'circle-blur': 0.8,
        },
      });

      map.addLayer({
        id: 'route-pulse-point',
        type: 'circle',
        source: 'route-pulse-source',
        paint: {
          'circle-radius': 5,
          'circle-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#10b981',
        },
      });

      // 6. Route Waypoint Pins Source & Layers (Origin & Destination)
      map.addSource('route-endpoints-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'route-endpoints-glow',
        type: 'circle',
        source: 'route-endpoints-source',
        paint: {
          'circle-radius': 14,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.35,
        },
      });

      map.addLayer({
        id: 'route-endpoints-circle',
        type: 'circle',
        source: 'route-endpoints-source',
        paint: {
          'circle-radius': 8,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'route-endpoints-label',
        type: 'symbol',
        source: 'route-endpoints-source',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 11,
          'text-font': ['Open Sans Semibold'],
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': isDark ? '#ffffff' : '#0f172a',
          'text-halo-color': isDark ? '#000000' : '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      // 7. Simulated Vehicles Source & Layers
      map.addSource('vehicles-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Ambulance Strobe Ring (visible for ambulance vehicle)
      map.addLayer({
        id: 'vehicles-ambulance-halo',
        type: 'circle',
        source: 'vehicles-source',
        filter: ['==', ['get', 'isAmbulance'], true],
        paint: {
          'circle-radius': 16,
          'circle-color': '#f43f5e',
          'circle-opacity': 0.45,
          'circle-blur': 0.6,
        },
      });

      map.addLayer({
        id: 'vehicles-layer',
        type: 'circle',
        source: 'vehicles-source',
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'isAmbulance'], true],
            7.5,
            ['interpolate', ['linear'], ['zoom'], 11, 3, 14, 5, 17, 7],
          ],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      });

      // Vehicle Interactive Cursor & Popup
      map.on('mouseenter', 'vehicles-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'vehicles-layer', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'vehicles-layer', (e) => {
        if (!e.features || e.features.length === 0) return;
        const p = e.features[0].properties || {};

        const isAmb = p.isAmbulance === true || p.type === 'ambulance';
        const html = isAmb
          ? `<div class="p-2.5 text-xs font-sans space-y-1.5 min-w-[240px]">
              <div class="flex items-center justify-between border-b pb-1 font-bold text-rose-600">
                <span class="flex items-center gap-1.5 font-mono">🚨 ${p.label || 'AMB-108'}</span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">EVP ACTIVE</span>
              </div>
              <div class="text-[11px] text-slate-700 space-y-0.5 pt-0.5">
                <div><strong>Corridor:</strong> ${p.roadName || 'Priority Trunk'}</div>
                <div><strong>Priority Speed:</strong> <span class="text-rose-600 font-bold">${p.speedKph} km/h</span></div>
                <div><strong>Signal Status:</strong> <span class="text-emerald-600 font-semibold">${p.status || 'Pre-empted Green Wave'}</span></div>
                <div><strong>Travel Time Saved:</strong> <span class="text-emerald-700 font-bold">${p.timeSaved || '3m 41s'}</span></div>
              </div>
              <div class="border-t pt-1 text-[9px] font-mono text-slate-400">
                NIU EMERGENCY VEHICLE PRE-EMPTION
              </div>
            </div>`
          : `<div class="p-2 text-xs font-sans space-y-1 min-w-[210px]">
              <div class="flex items-center justify-between border-b pb-1 font-bold text-slate-900">
                <span>${p.label || 'Vehicle'} (${p.id})</span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold" style="background:${p.color}20; color:${p.color};">
                  ${(p.type || 'COMMUTER').toUpperCase()}
                </span>
              </div>
              <div class="text-[11px] text-slate-600 space-y-0.5 pt-0.5">
                <div><strong>Speed:</strong> ${p.speedKph} km/h</div>
                <div><strong>Road:</strong> ${p.roadName || 'Monitored Link'}</div>
                <div><strong>Scenario Status:</strong> ${p.status || 'Active Flow'}</div>
              </div>
              <div class="border-t pt-1 text-[9px] font-mono text-slate-400">
                SIMULATED VEHICLE (NO GPS TRACKING)
              </div>
            </div>`;

        new Popup({ offset: 12, closeButton: true, className: 'niu-map-popup' })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });

      // Route Cursors & Clicks
      const routeLayers = ['selected-route-line', 'routes-alternatives-line'];
      routeLayers.forEach((layerId) => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('click', layerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          const p = e.features[0].properties;
          if (p?.id) {
            if (onSelectRouteRef.current) {
              onSelectRouteRef.current(p.id);
            }
            setInternalSelectedRouteId(p.id);
          }
        });
      });

      // Road Cursors & Popups
      map.on('mouseenter', 'road-traffic', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'road-traffic', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'road-traffic', (e) => {
        if (!e.features || e.features.length === 0) return;
        const p = e.features[0].properties || {};

        new Popup({ offset: 12, closeButton: true, className: 'niu-map-popup' })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="p-2 text-xs font-sans space-y-1.5 min-w-[210px]">
              <div class="flex items-center justify-between border-b pb-1 font-bold text-slate-900">
                <span>${p.name || 'Arterial Corridor'}</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">${(p.highwayType || 'primary').toUpperCase()}</span>
              </div>
              <div class="grid grid-cols-2 gap-1 text-[11px] pt-0.5">
                <div><span class="text-slate-500">Traffic:</span> <strong style="color: ${p.color};">${p.trafficState}</strong></div>
                <div><span class="text-slate-500">Speed:</span> <strong>${p.speedKph} km/h</strong></div>
                <div><span class="text-slate-500">Volume:</span> <strong>${p.volumeVph} veh/h</strong></div>
                <div><span class="text-slate-500">Capacity:</span> <strong>${p.capacityVph} veh/h</strong></div>
                <div><span class="text-slate-500">Queue:</span> <strong>${p.queueLengthMeters}m</strong></div>
                <div><span class="text-slate-500">Lanes:</span> <strong>${p.lanes}</strong></div>
              </div>
              <div class="border-t pt-1 text-[9px] font-mono text-slate-400">
                Source: NIU SIMULATION (Synthetic Demand)
              </div>
            </div>`
          )
          .addTo(map);
      });

      // Intersection Cursors & Popups
      map.on('mouseenter', 'intersections-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'intersections-point', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'intersections-point', (e) => {
        if (!e.features || e.features.length === 0) return;
        const p = e.features[0].properties || {};

        if (p.id && onSelectIntersectionRef.current) {
          onSelectIntersectionRef.current(p.id);
        }
        if (p.id) {
          selectIntersection(p.id);
        }

        new Popup({ offset: 14, closeButton: true, className: 'niu-map-popup' })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="p-2 text-xs font-sans space-y-1.5 min-w-[220px]">
              <div class="flex items-center justify-between border-b pb-1">
                <span class="font-bold text-slate-900">${p.name || 'Junction'}</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold" style="background-color: ${p.color}20; color: ${p.color};">
                  ${(p.congestionLevel || 'low').toUpperCase()}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-1 text-[11px] pt-0.5">
                <div><span class="text-slate-500">Vehicles:</span> <strong>${p.vehicleCount}v</strong></div>
                <div><span class="text-slate-500">Avg Speed:</span> <strong>${p.averageSpeedKmH} km/h</strong></div>
                <div><span class="text-slate-500">Queue:</span> <strong>${p.queueLengthMeters}m</strong></div>
                <div><span class="text-slate-500">Wait:</span> <strong>${p.waitingTimeMinutes} min</strong></div>
              </div>
              <div class="border-t pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Signal: ${p.hasSignal ? 'Active Split' : 'Uncontrolled'}</span>
                <span class="text-emerald-600 font-semibold">${p.status || 'MONITORED'}</span>
              </div>
            </div>`
          )
          .addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [isClient, webGLAvailable, isDark, selectIntersection]);

  // Update Data Sources and Camera when MapPayload changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !mapPayload) return;

    // Update Roads GeoJSON
    const roadsSource = map.getSource('roads-source') as GeoJSONSource | undefined;
    if (roadsSource && mapPayload.roadNetwork) {
      roadsSource.setData(mapPayload.roadNetwork);
    }

    // Update Intersections GeoJSON
    const interSource = map.getSource('intersections-source') as GeoJSONSource | undefined;
    if (interSource && mapPayload.intersections) {
      interSource.setData(mapPayload.intersections);
    }

    // Fit camera to zone bounding box if no route is active
    if (!activeSelectedRouteId && !routesGeoJSON) {
      if (mapPayload.boundingBox) {
        const bb = mapPayload.boundingBox;
        map.fitBounds(
          [
            [bb.minLng, bb.minLat],
            [bb.maxLng, bb.maxLat],
          ],
          {
            padding: 45,
            maxZoom: 15.5,
            duration: 1200,
          }
        );
      } else if (mapPayload.center) {
        map.flyTo({
          center: mapPayload.center,
          zoom: 14,
          duration: 1000,
        });
      }
    }
  }, [mapLoaded, mapPayload, activeSelectedRouteId, routesGeoJSON]);

  // Update Routes, Endpoints, and Camera when active routes or selection change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const routesSource = map.getSource('routes-source') as GeoJSONSource | undefined;
    if (routesSource) {
      routesSource.setData(activeRoutesGeoJSON || { type: 'FeatureCollection', features: [] });
    }

    const endpointsSource = map.getSource('route-endpoints-source') as GeoJSONSource | undefined;
    if (endpointsSource) {
      endpointsSource.setData(routeEndpointsToGeoJSON(activeOriginPoint, activeDestinationPoint));
    }

    // Extract selected route LineString coordinates for pulse animation & camera fit
    let selectedCoords: [number, number][] | null = null;
    let selectedColor = '#10b981';

    const currentId =
      activeSelectedRouteId ||
      (activeRoutesGeoJSON?.features && activeRoutesGeoJSON.features.length > 0
        ? (activeRoutesGeoJSON.features[0].properties?.id || String(activeRoutesGeoJSON.features[0].id))
        : '');

    if (activeRoutesGeoJSON && activeRoutesGeoJSON.features && activeRoutesGeoJSON.features.length > 0) {
      const targetFeature =
        activeRoutesGeoJSON.features.find(
          (f) => f.properties?.id === currentId || f.id === currentId || f.properties?.routeId === currentId
        ) || activeRoutesGeoJSON.features[0];

      if (targetFeature && targetFeature.geometry && targetFeature.geometry.coordinates) {
        selectedCoords = targetFeature.geometry.coordinates as [number, number][];
        selectedColor = targetFeature.properties?.colorHex || '#10b981';
      }
    }

    selectedRouteCoordinatesRef.current = selectedCoords;

    // Isolate selected route from alternative routes cleanly via filters
    if (map.getLayer('routes-alternatives-casing')) {
      map.setFilter('routes-alternatives-casing', ['!=', ['get', 'id'], currentId]);
    }
    if (map.getLayer('routes-alternatives-line')) {
      map.setFilter('routes-alternatives-line', ['!=', ['get', 'id'], currentId]);
    }

    if (map.getLayer('selected-route-glow')) {
      map.setFilter('selected-route-glow', ['==', ['get', 'id'], currentId]);
      map.setPaintProperty('selected-route-glow', 'line-color', selectedColor);
    }
    if (map.getLayer('selected-route-casing')) {
      map.setFilter('selected-route-casing', ['==', ['get', 'id'], currentId]);
    }
    if (map.getLayer('selected-route-line')) {
      map.setFilter('selected-route-line', ['==', ['get', 'id'], currentId]);
      map.setPaintProperty('selected-route-line', 'line-color', selectedColor);
    }

    if (map.getLayer('route-pulse-glow')) {
      map.setPaintProperty('route-pulse-glow', 'circle-color', selectedColor);
    }
    if (map.getLayer('route-pulse-point')) {
      map.setPaintProperty('route-pulse-point', 'circle-stroke-color', selectedColor);
    }

    // Fit camera smoothly to the selected route extent
    if (selectedCoords && selectedCoords.length >= 2) {
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      for (const [lng, lat] of selectedCoords) {
        if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }

      if (isFinite(minLng) && isFinite(maxLng) && isFinite(minLat) && isFinite(maxLat)) {
        const padLng = maxLng - minLng < 0.005 ? 0.008 : 0.002;
        const padLat = maxLat - minLat < 0.005 ? 0.008 : 0.002;
        map.fitBounds(
          [
            [minLng - padLng, minLat - padLat],
            [maxLng + padLng, maxLat + padLat],
          ],
          {
            padding: 70,
            duration: 1200,
            maxZoom: 15.5,
          }
        );
      }
    }
  }, [
    mapLoaded,
    activeRoutesGeoJSON,
    activeSelectedRouteId,
    activeOriginPoint,
    activeDestinationPoint,
  ]);

  // Update Layer Visibility Toggles & Emergency mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('road-traffic')) {
      map.setLayoutProperty('road-traffic', 'visibility', layers.showTraffic ? 'visible' : 'none');
    }
    if (map.getLayer('intersections-point')) {
      map.setLayoutProperty('intersections-point', 'visibility', layers.showIntersections ? 'visible' : 'none');
      map.setLayoutProperty('intersections-glow', 'visibility', layers.showIntersections ? 'visible' : 'none');
      map.setLayoutProperty('intersections-labels', 'visibility', layers.showIntersections ? 'visible' : 'none');
    }
    if (map.getLayer('road-emergency-glow')) {
      map.setLayoutProperty(
        'road-emergency-glow',
        'visibility',
        layers.showEmergency && simulationMode === 'emergency' ? 'visible' : 'none'
      );
    }
    if (map.getLayer('emergency-corridor-glow')) {
      map.setLayoutProperty(
        'emergency-corridor-glow',
        'visibility',
        layers.showEmergency && simulationMode === 'emergency' ? 'visible' : 'none'
      );
      map.setLayoutProperty(
        'emergency-corridor-line',
        'visibility',
        layers.showEmergency && simulationMode === 'emergency' ? 'visible' : 'none'
      );
    }
    if (map.getLayer('vehicles-layer')) {
      map.setLayoutProperty('vehicles-layer', 'visibility', layers.showVehicles ? 'visible' : 'none');
    }
  }, [mapLoaded, layers, simulationMode]);

  // Vehicles & Route Pulse Animation Loop
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !mapPayload) return;

    const seedZone = SEEDED_MOBILITY_ZONES.find((z) => z.id === activeZoneId) || SEEDED_MOBILITY_ZONES[0];
    const roads = seedZone.roads;

    const animateMobility = (timestamp: number) => {
      if (!lastTickTimeRef.current) lastTickTimeRef.current = timestamp;
      const elapsed = timestamp - lastTickTimeRef.current;

      // Update position every ~80ms for fluid, low-CPU rendering
      if (isSimulating && elapsed > 80 && !document.hidden) {
        tickRef.current += 1;
        lastTickTimeRef.current = timestamp;

        // 1. Update Simulated Vehicles
        if (layers.showVehicles) {
          const vehiclesSource = map.getSource('vehicles-source') as GeoJSONSource | undefined;
          if (vehiclesSource) {
            const vehiclesGeoJSON = generateSimulatedVehicles(
              roads,
              tickRef.current,
              16,
              simulationMode as SimulationTrafficMode,
              emergencyCorridor
            );
            vehiclesSource.setData(vehiclesGeoJSON);
          }
        }

        // 2. Update Emergency Corridor GeoJSON in emergency mode
        const emergencySource = map.getSource('emergency-corridor-source') as GeoJSONSource | undefined;
        if (emergencySource) {
          if (simulationMode === 'emergency' && layers.showEmergency) {
            const corridorGeoJSON = buildEmergencyCorridorGeoJSON(seedZone.intersections, seedZone.roads);
            emergencySource.setData(corridorGeoJSON);
          } else {
            emergencySource.setData({ type: 'FeatureCollection', features: [] });
          }
        }

        // 3. Update Route Pulse point along selected route geometry
        const pulseSource = map.getSource('route-pulse-source') as GeoJSONSource | undefined;
        if (pulseSource) {
          if (selectedRouteCoordinatesRef.current && selectedRouteCoordinatesRef.current.length >= 2) {
            const pulseGeoJSON = generateRoutePulsePoint(
              selectedRouteCoordinatesRef.current,
              tickRef.current
            );
            pulseSource.setData(pulseGeoJSON);
          } else {
            pulseSource.setData({ type: 'FeatureCollection', features: [] });
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animateMobility);
    };

    animationFrameRef.current = requestAnimationFrame(animateMobility);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    mapLoaded,
    mapPayload,
    layers.showVehicles,
    layers.showEmergency,
    activeZoneId,
    simulationMode,
    emergencyCorridor,
    isSimulating,
  ]);

  // Control Callbacks
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetBounds = () => {
    if (!mapRef.current || !mapPayload?.boundingBox) return;
    const bb = mapPayload.boundingBox;
    mapRef.current.fitBounds(
      [
        [bb.minLng, bb.minLat],
        [bb.maxLng, bb.maxLat],
      ],
      { padding: 45, maxZoom: 15.5, duration: 800 }
    );
  };

  const handleToggleLayer = (key: keyof MapLayerToggles) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleSimulate = () => {
    setIsSimulating((prev) => !prev);
  };

  const handleResetSimulation = () => {
    tickRef.current = 0;
    setIsSimulating(true);
    handleResetBounds();
  };

  const handleSelectDemoCorridor = (demoRoute: DemoRouteDefinition) => {
    const comp = demoRouteToComparisonResult(demoRoute, simulationMode);
    const topAlt = comp.recommendedRoute || comp.routes[0];
    setInternalComparison(comp);
    setInternalSelectedRouteId(topAlt?.id || null);
    if (onSelectRouteRef.current && topAlt?.id) {
      onSelectRouteRef.current(topAlt.id);
    }
  };

  const handleClearDemoRoute = () => {
    setInternalComparison(null);
    setInternalSelectedRouteId(null);
    selectedRouteCoordinatesRef.current = null;
    handleResetBounds();
  };

  // Fallback if WebGL is unavailable
  if (isClient && !webGLAvailable) {
    return (
      <div
        className={`relative w-full ${heightClass} rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090d16] p-6 flex flex-col items-center justify-center text-center`}
      >
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          WebGL Hardware Acceleration Unavailable
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-4">
          Interactive MapLibre canvas requires WebGL. NIU traffic intelligence and signal optimization algorithms continue operating in deterministic simulation mode.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg text-left text-xs font-mono">
          <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-slate-400 block text-[10px]">Zone</span>
            <strong className="text-slate-800 dark:text-slate-200">{mapPayload?.zoneName || 'Greater Noida'}</strong>
          </div>
          <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-slate-400 block text-[10px]">Roads</span>
            <strong className="text-emerald-500">{mapPayload?.roadNetwork.features.length || 0} Segments</strong>
          </div>
          <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-slate-400 block text-[10px]">Junctions</span>
            <strong className="text-cyan-500">{mapPayload?.intersections.features.length || 0} Nodes</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#080c14] overflow-hidden select-none flex flex-col transition-colors duration-150 shadow-xs`}
    >
      {/* MapLibre DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Top Left: Map Status Panel */}
      <div className="absolute top-3 left-3 z-10 max-w-[280px] sm:max-w-xs">
        <MapStatus
          zoneName={mapPayload?.zoneName || 'Greater Noida Core'}
          radiusMeters={mapPayload?.radiusMeters || 1500}
          roadCount={mapPayload?.roadNetwork.features.length || 0}
          intersectionCount={mapPayload?.intersections.features.length || 0}
          simulationMode={simulationMode}
          lastSimulatedAt={mapPayload?.lastSimulatedAt}
        />
      </div>

      {/* Top Right: Map Controls (Playback, Zoom, Recenter, Layer Toggles) */}
      <div className="absolute top-3 right-3 z-10">
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetBounds={handleResetBounds}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          isSimulating={isSimulating}
          onToggleSimulate={handleToggleSimulate}
          onResetSimulation={handleResetSimulation}
        />
      </div>

      {/* Bottom Left: Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 max-w-[260px]">
        <MapLegend />
      </div>

      {/* Bottom Center: Simulation Status & Vehicle Telemetry Attribution */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 text-white border border-slate-700/80 text-[10px] font-mono backdrop-blur-md shadow-md">
          <span
            className={`w-2 h-2 rounded-full ${
              isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          ></span>
          <span>{isSimulating ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">OSM ROAD GEOMETRY</span>
        </div>
      </div>

      {/* Bottom Right / Drawer Toggle: Demo Corridors Button */}
      {showDemoRoutePicker && !routesGeoJSON && (
        <div className="absolute bottom-3 right-3 z-10">
          <button
            onClick={() => setDemoDrawerOpen(!demoDrawerOpen)}
            className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <RouteIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Demo Corridors ({demoRoutesList.length})</span>
            {demoDrawerOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      )}

      {/* Floating Demo Corridors Drawer (Overlay) */}
      {showDemoRoutePicker && !routesGeoJSON && demoDrawerOpen && (
        <div className="absolute bottom-12 right-3 z-20 w-80 max-h-[380px] bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl overflow-hidden flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <RouteIcon className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Curated Demo Corridors
              </span>
            </div>
            <button
              onClick={() => setDemoDrawerOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto space-y-1.5 pr-1 max-h-[300px] scrollbar-thin">
            {demoRoutesList.map((r) => {
              const isSelected = activeSelectedRouteId?.includes(r.id);
              const isEVP = r.category === 'emergency';
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectDemoCorridor(r)}
                  className={`w-full p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 text-slate-900 dark:text-slate-100 ring-1 ring-emerald-500/30'
                      : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-[11px] truncate">{r.name}</span>
                    {isEVP && <Siren className="w-3 h-3 text-rose-500 animate-pulse shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                    <span>{r.distanceKm} km · ~{r.etaMinutes} min</span>
                    <span className="capitalize text-emerald-600 dark:text-emerald-400 font-medium">
                      {r.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Active Route Telemetry Pill (when demo route is active) */}
      {activeSelectedRouteAlt && internalComparison && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 max-w-md w-11/12 sm:w-auto bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeSelectedRouteAlt.colorHex }}
            ></span>
            <div className="truncate">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                {activeSelectedRouteAlt.title}
              </span>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {activeSelectedRouteAlt.etaMinutes}m
                </span>
                <span>·</span>
                <span>{activeSelectedRouteAlt.distanceKm}km</span>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Leaf className="w-2.5 h-2.5" />
                  {activeSelectedRouteAlt.estimatedCo2Kg}kg
                </span>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 font-semibold">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {activeSelectedRouteAlt.niuScore} NIU
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleClearDemoRoute}
            title="Deselect demo route"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loadingPayload && (
        <div className="absolute inset-0 z-30 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center pointer-events-none transition-opacity">
          <div className="bg-white/95 dark:bg-[#0b0f19]/95 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 text-slate-800 dark:text-slate-200 shadow-md">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            <span>Synchronizing Mobility Zone Geometry...</span>
          </div>
        </div>
      )}
    </div>
  );
}
