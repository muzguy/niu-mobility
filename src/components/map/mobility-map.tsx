'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Map as MapLibreMap, Popup, AttributionControl, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useSimulation } from '@/context/simulation-context';
import { useTheme } from '@/context/theme-context';
import { apiGetZoneMapPayload } from '@/lib/api-client';
import { getMapStyle, isWebGLSupported } from '@/lib/map/map-styles';
import { roadsToGeoJSON, intersectionsToGeoJSON, generateSimulatedVehicles } from '@/lib/map/geojson-converter';
import { SEEDED_MOBILITY_ZONES } from '@/data/mobility-zones-seed';
import { MapControls } from './map-controls';
import { MapLegend } from './map-legend';
import { MapStatus } from './map-status';
import { MapLayerToggles, ZoneMapPayload } from '@/types/map';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { routeEndpointsToGeoJSON } from '@/lib/map/geojson-converter';

interface MobilityMapProps {
  activeZoneId?: string;
  onSelectIntersection?: (id: string) => void;
  onSelectRoute?: (routeId: string) => void;
  heightClass?: string;
  routesGeoJSON?: GeoJSON.FeatureCollection<GeoJSON.LineString> | null;
  selectedRouteId?: string | null;
  originPoint?: { coordinate: { latitude: number; longitude: number }; name?: string } | null;
  destinationPoint?: { coordinate: { latitude: number; longitude: number }; name?: string } | null;
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
}: MobilityMapProps) {
  const { simulationMode, selectIntersection } = useSimulation();
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

  // Client hydration & WebGL capability check without cascading re-renders
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
      pitch: 25,
      bearing: 0,
      attributionControl: false,
    });

    // Intercept MapLibre errors to prevent leaking raw CARTO tile URLs containing API keys in console/server output
    map.on('error', (event) => {
      const err = event?.error;
      const rawUrl =
        typeof err === 'object' && err !== null && 'url' in err
          ? String((err as { url?: string }).url)
          : '';

      // If the error relates to CARTO basemap tiles or contains key query parameters
      if (rawUrl && (rawUrl.includes('cartocdn.com') || rawUrl.includes('key='))) {
        // Strip sensitive credentials: never log process.env.NEXT_PUBLIC_CARTO_API_KEY or full URL with key
        return;
      }
    });

    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);

      // Safe diagnostic logging in development mode without exposing credentials or full URLs
      if (process.env.NODE_ENV === 'development') {
        const isCartoConfigured = Boolean(process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim());
        console.info(`CARTO key configured: ${isCartoConfigured}`);
        if (isCartoConfigured) {
          console.info('CARTO tile request: authenticated');
        }
      }

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
          'line-color': isDark ? '#172033' : '#cbd5e1',
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

      // 2. Intersections Source & Layers
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

      // 3. Simulated Vehicles Source & Layer
      map.addSource('vehicles-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'vehicles-layer',
        type: 'circle',
        source: 'vehicles-source',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2.5, 14, 4.5, 17, 6],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      });

      // 4. Routes GeoJSON Source & Polyline Layers
      map.addSource('routes-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'routes-casing',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': isDark ? '#000000' : '#ffffff',
          'line-width': 6,
          'line-opacity': 0.7,
        },
      });

      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 4.5,
          'line-opacity': 0.85,
        },
      });

      // Route Waypoint Pins Source & Layers (Origin & Destination)
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

      map.on('mouseenter', 'routes-line', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'routes-line', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'routes-line', (e) => {
        if (!e.features || e.features.length === 0) return;
        const p = e.features[0].properties;
        if (p?.id && onSelectRouteRef.current) {
          onSelectRouteRef.current(p.id);
        }
      });

      // 5. Interactive Hover Cursors
      map.on('mouseenter', 'road-traffic', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'road-traffic', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('mouseenter', 'intersections-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'intersections-point', () => {
        map.getCanvas().style.cursor = '';
      });

      // 5. Interactive Popups on Click
      map.on('click', 'road-traffic', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const p = feature.properties || {};

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

      map.on('click', 'intersections-point', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const p = feature.properties || {};

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

    // Fit camera to zone bounding box
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
  }, [mapLoaded, mapPayload]);

  // Update Routes and Waypoint Pins when routesGeoJSON or endpoints change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const routesSource = map.getSource('routes-source') as GeoJSONSource | undefined;
    if (routesSource) {
      routesSource.setData(routesGeoJSON || { type: 'FeatureCollection', features: [] });
    }

    const endpointsSource = map.getSource('route-endpoints-source') as GeoJSONSource | undefined;
    if (endpointsSource) {
      endpointsSource.setData(routeEndpointsToGeoJSON(originPoint, destinationPoint));
    }

    // Dynamic styling update for selected route
    if (map.getLayer('routes-line')) {
      map.setPaintProperty('routes-line', 'line-color', [
        'case',
        ['==', ['get', 'id'], selectedRouteId || ''],
        ['get', 'colorHex'],
        ['get', 'isRecommended'],
        '#10b981',
        '#64748b',
      ]);
      map.setPaintProperty('routes-line', 'line-width', [
        'case',
        ['==', ['get', 'id'], selectedRouteId || ''],
        6,
        3.5,
      ]);
      map.setPaintProperty('routes-line', 'line-opacity', [
        'case',
        ['==', ['get', 'id'], selectedRouteId || ''],
        1.0,
        0.45,
      ]);
    }

    // If routes are provided, fit camera smoothly to the route extent
    if (routesGeoJSON && routesGeoJSON.features && routesGeoJSON.features.length > 0) {
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      for (const feat of routesGeoJSON.features) {
        if (feat.geometry && feat.geometry.coordinates) {
          for (const coord of feat.geometry.coordinates) {
            const [lng, lat] = coord;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          }
        }
      }

      if (minLng < maxLng && minLat < maxLat) {
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          {
            padding: 55,
            duration: 1000,
            maxZoom: 15.5,
          }
        );
      }
    }
  }, [mapLoaded, routesGeoJSON, selectedRouteId, originPoint, destinationPoint]);

  // Update Layer Visibility Toggles
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
    if (map.getLayer('vehicles-layer')) {
      map.setLayoutProperty('vehicles-layer', 'visibility', layers.showVehicles ? 'visible' : 'none');
    }
  }, [mapLoaded, layers, simulationMode]);

  // Simulated Vehicles Animation Loop
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !mapPayload || !layers.showVehicles) return;

    // Convert GeoRoadSegment coordinates from roadNetwork GeoJSON
    const seedZone = SEEDED_MOBILITY_ZONES.find((z) => z.id === activeZoneId) || SEEDED_MOBILITY_ZONES[0];
    const roads = seedZone.roads;

    const animateVehicles = (timestamp: number) => {
      if (!lastTickTimeRef.current) lastTickTimeRef.current = timestamp;
      const elapsed = timestamp - lastTickTimeRef.current;

      // Update position every ~120ms to avoid high CPU usage
      if (elapsed > 120 && !document.hidden) {
        tickRef.current += 1;
        lastTickTimeRef.current = timestamp;

        const vehiclesSource = map.getSource('vehicles-source') as GeoJSONSource | undefined;
        if (vehiclesSource) {
          const vehiclesGeoJSON = generateSimulatedVehicles(roads, tickRef.current, 16);
          vehiclesSource.setData(vehiclesGeoJSON);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animateVehicles);
    };

    animationFrameRef.current = requestAnimationFrame(animateVehicles);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mapLoaded, mapPayload, layers.showVehicles, activeZoneId]);

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

      {/* Top Left: Map Status Panel (Zone name, road count, data availability) */}
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

      {/* Top Right: Map Controls (Zoom in/out, Recenter, Layer Toggles) */}
      <div className="absolute top-3 right-3 z-10">
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetBounds={handleResetBounds}
          layers={layers}
          onToggleLayer={handleToggleLayer}
        />
      </div>

      {/* Bottom Left: Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 max-w-[260px]">
        <MapLegend />
      </div>

      {/* Bottom Center: Simulated Vehicles Attribution Pill */}
      {layers.showVehicles && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 text-white border border-slate-700/80 text-[10px] font-mono backdrop-blur-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
          <span>SIMULATED VEHICLE PARTICLES (NO GPS TRACKING)</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loadingPayload && (
        <div className="absolute inset-0 z-20 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center pointer-events-none transition-opacity">
          <div className="bg-white/95 dark:bg-[#0b0f19]/95 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 text-slate-800 dark:text-slate-200 shadow-md">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            <span>Synchronizing Mobility Zone Geometry...</span>
          </div>
        </div>
      )}
    </div>
  );
}
