'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RoutingObjective, SmartRouteComparisonResult } from '@/types/routing';
import { RouteCard } from './route-card';
import { MobilityMap } from '@/components/map/mobility-map';
import { routesToGeoJSON } from '@/lib/map/geojson-converter';
import { useSimulation } from '@/context/simulation-context';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { apiGetRoutes } from '@/lib/api-client';
import {
  MapPin,
  ArrowRightLeft,
  Route as RouteIcon,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { getDemoLocations } from '@/lib/routing/demo-routes-registry';

export function RouteComparison() {
  const { simulationMode, setSimulationMode } = useSimulation();

  const candidateLocations = useMemo(() => getDemoLocations().map((l) => l.name), []);

  const [origin, setOrigin] = useState<string>('Pari Chowk');
  const [destination, setDestination] = useState<string>('Knowledge Park');
  const [objective, setObjective] = useState<RoutingObjective>('NIU_OPTIMAL');

  const [comparisonResult, setComparisonResult] = useState<SmartRouteComparisonResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isIdentical = useMemo(() => {
    const o = origin.trim().toLowerCase();
    const d = destination.trim().toLowerCase();
    return o.length > 0 && d.length > 0 && o === d;
  }, [origin, destination]);

  const effectiveErrorMessage = isIdentical ? 'Origin and destination cannot be identical.' : errorMessage;

  // Recalculate routes on input, scenario, or objective change
  useEffect(() => {
    let isMounted = true;
    const trimmedOrigin = origin.trim();
    const trimmedDest = destination.trim();

    if (!trimmedOrigin || !trimmedDest || trimmedOrigin.toLowerCase() === trimmedDest.toLowerCase()) {
      return;
    }

    apiGetRoutes(trimmedOrigin, trimmedDest, {
      zoneId: 'greater-noida-core',
      objective,
      scenario: simulationMode,
    })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setComparisonResult(res.data);
          const topRoute = res.data.recommendedRoute || res.data.routes[0];
          if (topRoute) {
            setSelectedRouteId(topRoute.id);
          }
        } else {
          setErrorMessage(res.error?.message || 'Failed to calculate smart route.');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Routing calculation request failed.';
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [origin, destination, objective, simulationMode]);

  const handleManualRefresh = useCallback(() => {
    const trimmedOrigin = origin.trim();
    const trimmedDest = destination.trim();

    if (!trimmedOrigin || !trimmedDest) return;
    if (trimmedOrigin.toLowerCase() === trimmedDest.toLowerCase()) {
      setErrorMessage('Origin and destination cannot be identical.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    apiGetRoutes(trimmedOrigin, trimmedDest, {
      zoneId: 'greater-noida-core',
      objective,
      scenario: simulationMode,
    })
      .then((res) => {
        if (res.success && res.data) {
          setComparisonResult(res.data);
          const topRoute = res.data.recommendedRoute || res.data.routes[0];
          if (topRoute) {
            setSelectedRouteId(topRoute.id);
          }
        } else {
          setErrorMessage(res.error?.message || 'Failed to calculate smart route.');
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Routing calculation request failed.';
        setErrorMessage(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [origin, destination, objective, simulationMode]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const routes = useMemo(() => comparisonResult?.routes || [], [comparisonResult]);
  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) || routes[0],
    [routes, selectedRouteId]
  );
  const recommendedRoute = useMemo(
    () => comparisonResult?.recommendedRoute || routes.find((r) => r.isRecommended) || routes[0],
    [comparisonResult, routes]
  );

  // Convert routes into GeoJSON LineStrings for MapLibre
  const routesGeoJSON = useMemo(() => {
    if (!routes || routes.length === 0) return null;
    return routesToGeoJSON(routes);
  }, [routes]);

  const originPoint = useMemo(() => {
    if (!comparisonResult) return null;
    return {
      coordinate: comparisonResult.origin.snappedCoordinate,
      name: comparisonResult.origin.resolvedName,
    };
  }, [comparisonResult]);

  const destinationPoint = useMemo(() => {
    if (!comparisonResult) return null;
    return {
      coordinate: comparisonResult.destination.snappedCoordinate,
      name: comparisonResult.destination.resolvedName,
    };
  }, [comparisonResult]);

  return (
    <div className="space-y-6">
      {/* Route Query Formulation Panel */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/90 p-5 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Traffic-Aware Smart Route Engine
              </h2>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                DETERMINISTIC GRAPH A*
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Synthesizes real OSM road geometry with BPR speed-flow simulation and IPCC carbon emission modeling
            </p>
          </div>

          {/* Scenario & Objective Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
              Zone: <strong className="text-slate-900 dark:text-slate-200">Greater Noida Core</strong>
            </span>
          </div>
        </div>

        {/* Quick Demo Route Presets */}
        <div className="mb-4">
          <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5">
            Curated Demo Corridors (OSM Road Network):
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { orig: 'Pari Chowk', dest: 'Knowledge Park', label: 'Pari Chowk ➔ Knowledge Park', isEVP: false },
              { orig: 'Alpha 1', dest: 'Knowledge Park', label: 'Alpha 1 ➔ Knowledge Park', isEVP: false },
              { orig: 'Alpha 2', dest: 'Jagat Farm', label: 'Alpha 2 ➔ Jagat Farm', isEVP: false },
              { orig: 'Pari Chowk', dest: 'Jagat Farm', label: 'Pari Chowk ➔ Jagat Farm', isEVP: false },
              { orig: 'Alpha 1', dest: 'Alpha 2', label: 'Alpha 1 ➔ Alpha 2', isEVP: false },
              { orig: 'Pari Chowk', dest: 'Galgotias University', label: 'Pari Chowk ➔ Galgotias', isEVP: false },
              { orig: 'Alpha 1', dest: 'Galgotias University', label: 'Alpha 1 ➔ Galgotias', isEVP: false },
              { orig: 'Knowledge Park', dest: 'Galgotias University', label: 'KP ➔ Galgotias', isEVP: false },
              { orig: 'Galgotias University', dest: 'Dankaur Junction', label: 'Galgotias ➔ Dankaur', isEVP: false },
              { orig: 'Jagat Farm', dest: 'Alpha 1', label: 'Jagat Farm ➔ Alpha 1', isEVP: false },
              { orig: 'Alpha 1', dest: 'Knowledge Park', label: '🚨 Alpha 1 ➔ KP Medical (EVP)', isEVP: true },
            ].map((p, idx) => {
              const isActive = origin.toLowerCase() === p.orig.toLowerCase() && destination.toLowerCase() === p.dest.toLowerCase();
              return (
                <button
                  key={`preset-${idx}`}
                  onClick={() => {
                    setOrigin(p.orig);
                    setDestination(p.dest);
                    if (p.isEVP) {
                      setSimulationMode('emergency');
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? p.isEVP
                        ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.isEVP ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Origin */}
          <div className="md:col-span-3">
            <label htmlFor="origin-select" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Origin Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none z-10" />
              <select
                id="origin-select"
                aria-label="Origin Location"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {candidateLocations.map((loc) => (
                  <option key={`orig-${loc}`} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap */}
          <div className="md:col-span-1 flex justify-center pb-1">
            <button
              onClick={handleSwap}
              title="Swap Origin and Destination"
              aria-label="Swap nodes"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-3">
            <label htmlFor="dest-select" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Destination Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-cyan-600 dark:text-cyan-400 pointer-events-none z-10" />
              <select
                id="dest-select"
                aria-label="Destination Location"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {candidateLocations.map((loc) => (
                  <option key={`dest-${loc}`} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Simulation Scenario
            </label>
            <select
              value={simulationMode}
              onChange={(e) => setSimulationMode(e.target.value as SimulationTrafficMode)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer capitalize"
            >
              <option value="normal">Normal (Baseline)</option>
              <option value="rush_hour">Rush Hour (Peak Demand)</option>
              <option value="optimized">Optimized (Adaptive Signal)</option>
              <option value="emergency">Emergency (Pre-emption)</option>
            </select>
          </div>

          {/* Objective Selector */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Routing Objective
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as RoutingObjective)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="NIU_OPTIMAL">NIU Optimal (Balanced)</option>
              <option value="FASTEST">Fastest (Min Time)</option>
              <option value="SHORTEST">Shortest (Min Distance)</option>
              <option value="LOWEST_EMISSIONS">Lowest Emissions</option>
              <option value="LOWEST_CONGESTION">Lowest Congestion</option>
            </select>
          </div>

          {/* Recalculate Button */}
          <div className="md:col-span-1">
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              title="Recalculate Routes"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {effectiveErrorMessage && (
          <div className="mt-4 p-3 rounded-lg border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{effectiveErrorMessage}</span>
          </div>
        )}
      </div>

      {/* Recommended Route Hero Banner */}
      {recommendedRoute && !effectiveErrorMessage && (
        <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono">
                  NIU RECOMMENDED: {recommendedRoute.title}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded font-semibold">
                  SCORE {recommendedRoute.niuScore}/100
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                {recommendedRoute.etaMinutes} min · {recommendedRoute.distanceKm} km · {recommendedRoute.estimatedCo2Kg} kg EST. CO2 · {recommendedRoute.trafficLevel} Flow
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1 font-medium">
                &ldquo;{recommendedRoute.recommendationReason}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {selectedRouteId !== recommendedRoute.id && (
              <button
                onClick={() => setSelectedRouteId(recommendedRoute.id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Select NIU Optimal
              </button>
            )}
            <div className="text-[11px] font-mono text-slate-700 dark:text-slate-400 bg-white/90 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              Snapped to OSM: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{comparisonResult?.origin.snapDistanceMeters ?? 0}m</span>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Route Cards Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            isSelected={selectedRouteId === route.id}
            onSelect={setSelectedRouteId}
          />
        ))}
      </div>

      {/* Embedded MapLibre Real Route Geometry Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Real Road Network Route Trajectory (MapLibre / OpenStreetMap)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Active: <strong className="text-emerald-600 dark:text-emerald-400">{selectedRoute?.title || 'Route 1'}</strong>
          </span>
        </div>

        <MobilityMap
          activeZoneId="greater-noida-core"
          heightClass="h-[440px] sm:h-[500px]"
          routesGeoJSON={routesGeoJSON}
          selectedRouteId={selectedRouteId}
          originPoint={originPoint}
          destinationPoint={destinationPoint}
          onSelectRoute={setSelectedRouteId}
          showDemoRoutePicker={false}
        />
      </div>

      {/* Tripartite Data Provenance & Methodological Integrity Footer */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>NIU Methodological Provenance & Modeling Specifications</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 text-[11px] font-mono">
          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-slate-500 dark:text-slate-400 text-[10px]">ROAD NETWORK</div>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">REAL — OSM / SEED</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Real Greater Noida Geometry</div>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-slate-500 dark:text-slate-400 text-[10px]">TRAFFIC ENGINE</div>
            <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">SIMULATED (BPR FLOW)</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Scenario Diurnal Multipliers</div>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-slate-500 dark:text-slate-400 text-[10px]">ROUTE COMPUTATION</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">NIU GRAPH A*</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Multi-Objective Cost Optimization</div>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-slate-500 dark:text-slate-400 text-[10px]">CARBON EMISSIONS</div>
            <div className="font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">ESTIMATED CO2</div>
            <div className="text-[9px] text-slate-400 mt-0.5">IPCC / CEA Thermodynamic Model</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
          Traffic-aware route optimization using real OSM road geometry and NIU&apos;s deterministic mobility simulation.
          NIU is not yet connected to live physical road sensors or proprietary turn-by-turn navigation providers.
        </p>
      </div>
    </div>
  );
}
