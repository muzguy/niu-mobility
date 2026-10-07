'use client';

import React, { useState, useMemo } from 'react';
import {
  getAllDemoRoutes,
  getDemoLocations,
  DemoRouteDefinition,
  demoRouteToComparisonResult,
} from '@/lib/routing/demo-routes-registry';
import { SmartRouteAlternative, SmartRouteComparisonResult } from '@/types/routing';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import {
  MapPin,
  ArrowRightLeft,
  Route as RouteIcon,
  ShieldCheck,
  Siren,
  Clock,
  Leaf,
  Activity,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DemoRouteSelectorProps {
  onSelectRouteResult: (result: SmartRouteComparisonResult, selectedAlternativeId?: string) => void;
  currentSelectedRouteId?: string | null;
  scenario?: SimulationTrafficMode;
  className?: string;
  compact?: boolean;
}

export function DemoRouteSelector({
  onSelectRouteResult,
  currentSelectedRouteId,
  scenario = 'normal',
  className = '',
  compact = false,
}: DemoRouteSelectorProps) {
  const allRoutes = useMemo(() => getAllDemoRoutes(), []);
  const locations = useMemo(() => getDemoLocations(), []);

  const [origin, setOrigin] = useState<string>('Pari Chowk');
  const [destination, setDestination] = useState<string>('Knowledge Park');
  const [activeDemoRouteId, setActiveDemoRouteId] = useState<string>('route-pari-kp');
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  // Active route definition
  const activeRoute = useMemo(
    () => allRoutes.find((r) => r.id === activeDemoRouteId) || allRoutes[0],
    [allRoutes, activeDemoRouteId]
  );

  const handleSelectPreset = (route: DemoRouteDefinition) => {
    setActiveDemoRouteId(route.id);
    setOrigin(route.origin.name);
    setDestination(route.destination.name);

    const comp = demoRouteToComparisonResult(route, scenario);
    const topAlt = comp.recommendedRoute || comp.routes[0];
    onSelectRouteResult(comp, topAlt?.id);
  };

  const handleCalculateCustom = () => {
    // Try to find matching demo route
    const oTrim = origin.trim().toLowerCase();
    const dTrim = destination.trim().toLowerCase();

    const matched = allRoutes.find(
      (r) =>
        (r.origin.name.toLowerCase().includes(oTrim) || oTrim.includes(r.origin.name.toLowerCase())) &&
        (r.destination.name.toLowerCase().includes(dTrim) || dTrim.includes(r.destination.name.toLowerCase()))
    );

    if (matched) {
      handleSelectPreset(matched);
      return;
    }

    // If reverse matched
    const revMatched = allRoutes.find(
      (r) =>
        (r.origin.name.toLowerCase().includes(dTrim) || dTrim.includes(r.origin.name.toLowerCase())) &&
        (r.destination.name.toLowerCase().includes(oTrim) || oTrim.includes(r.destination.name.toLowerCase()))
    );

    if (revMatched) {
      handleSelectPreset(revMatched);
      return;
    }

    // Fallback to active route
    if (activeRoute) {
      handleSelectPreset(activeRoute);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div
      className={`bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-lg text-xs space-y-3 pointer-events-auto transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <RouteIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              Curated Greater Noida / NCR Demo Corridors
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {allRoutes.length} calibrated routes grounded in real OpenStreetMap road geometry
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          aria-label={isExpanded ? 'Collapse demo routes' : 'Expand demo routes'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Preset Quick Badges */}
      <div>
        <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5">
          Quick Demo Corridors:
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {allRoutes.slice(0, 8).map((r) => {
            const isSelected = activeDemoRouteId === r.id;
            const isEmergency = r.category === 'emergency';
            return (
              <button
                key={r.id}
                onClick={() => handleSelectPreset(r)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? isEmergency
                      ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 font-semibold shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isEmergency ? (
                  <Siren className="w-3 h-3 text-rose-500 animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
                <span>{r.origin.name} ➔ {r.destination.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Origin & Destination Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-1">
            {/* Origin Dropdown */}
            <div className="sm:col-span-5">
              <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Origin
              </label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={`orig-${loc.id}`} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="sm:col-span-2 flex justify-center pb-0.5">
              <button
                onClick={handleSwap}
                title="Swap Origin and Destination"
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Destination Dropdown */}
            <div className="sm:col-span-5">
              <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={`dest-${loc.id}`} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Network: Real OSM · Flow: NIU Simulated
            </span>
            <button
              onClick={handleCalculateCustom}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inspect Corridor</span>
            </button>
          </div>

          {/* Active Route Telemetry & Alternatives */}
          {activeRoute && (
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {activeRoute.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                    {activeRoute.category}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {activeRoute.distanceKm} km · ~{activeRoute.etaMinutes} min
                </span>
              </div>

              {/* Corridor Alternatives Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {activeRoute.alternatives.map((alt: SmartRouteAlternative) => {
                  const isAltSelected = currentSelectedRouteId === alt.id;
                  return (
                    <button
                      key={alt.id}
                      onClick={() => {
                        const comp = demoRouteToComparisonResult(activeRoute, scenario);
                        onSelectRouteResult(comp, alt.id);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isAltSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 truncate">
                          {alt.title}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: alt.colorHex }}
                        ></span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{alt.etaMinutes}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Leaf className="w-2.5 h-2.5 text-emerald-500" />
                          <span>{alt.estimatedCo2Kg}kg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-2.5 h-2.5 text-amber-500" />
                          <span>{alt.congestionScore}/100</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>{alt.niuScore} NIU</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
