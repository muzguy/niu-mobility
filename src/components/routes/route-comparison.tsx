'use client';

import React, { useState, useEffect } from 'react';
import { RouteOption } from '@/types/routing';
import { getRoutes } from '@/lib/routing/routing-engine';
import { RouteCard } from './route-card';
import { MapPin, ArrowRightLeft, Route as RouteIcon, Info } from 'lucide-react';

import { apiGetRoutes } from '@/lib/api-client';

const SECTORS = ['Alpha 1', 'Alpha 2', 'Pari Chowk', 'Knowledge Park', 'Jagat Farm'];

export function RouteComparison() {
  const [origin, setOrigin] = useState<string>('Alpha 1');
  const [destination, setDestination] = useState<string>('Knowledge Park');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadRoutes() {
      setIsLoading(true);
      try {
        const res = await apiGetRoutes(origin, destination);
        if (res.success && res.data && res.data.routes && res.data.routes.length > 0) {
          setRoutes(res.data.routes);
          const rec = res.data.recommendedRoute || res.data.routes[0];
          if (rec) setSelectedRouteId(rec.id);
        } else {
          const computed = await getRoutes(origin, destination);
          setRoutes(computed);
          const rec = computed.find((r) => r.isRecommended) || computed[0];
          if (rec) setSelectedRouteId(rec.id);
        }
      } catch {
        const computed = await getRoutes(origin, destination);
        setRoutes(computed);
        const rec = computed.find((r) => r.isRecommended) || computed[0];
        if (rec) setSelectedRouteId(rec.id);
      } finally {
        setIsLoading(false);
      }
    }
    loadRoutes();
  }, [origin, destination]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="space-y-6">
      {/* Route Query Selector */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/90 p-5 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Smart Route Comparison</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-criteria trajectory engine contrasting travel time vs. environmental footprint
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold self-start sm:self-auto">
            SIMULATED ROUTE PROVIDER
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* Origin */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Origin Node</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {SECTORS.map((s) => (
                  <option key={`orig-${s}`} value={s} disabled={s === destination}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap */}
          <div className="md:col-span-1 flex justify-center pt-3 md:pt-0">
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
          <div className="md:col-span-5">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Destination Node</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {SECTORS.map((s) => (
                  <option key={`dest-${s}`} value={s} disabled={s === origin}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Route Highlights Banner */}
      {selectedRoute && (
        <div className="p-4 rounded-xl border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50/70 dark:bg-cyan-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <RouteIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{selectedRoute.title}</span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono">• {selectedRoute.badge}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                Estimated Transit: {selectedRoute.etaMinutes} min | CO2: {selectedRoute.estimatedCo2Kg} kg | Distance: {selectedRoute.distanceKm} km
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-700 dark:text-slate-400 bg-white/90 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto font-medium">
            {selectedRoute.type === 'greenest'
              ? '🌿 Lowest Carbon Corridor: Saves ~1.48 kg CO2 vs Fastest'
              : selectedRoute.type === 'balanced'
              ? '⚖️ Optimal Balance: Avoids Pari Chowk peak delays'
              : '⚡ Fastest Radial: Higher stop-and-go acceleration cycles'}
          </div>
        </div>
      )}

      {/* Route Cards Comparison Grid (Fastest, Balanced, Greenest) */}
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

      {/* Future Mapbox Integration Disclaimer */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-slate-800 dark:text-slate-300">Phase 1 Simulated Routing Provider Active</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            All route calculations, travel durations, and carbon emissions represent calibrated models based on Greater Noida urban geometry. The architecture is decoupled via the <code className="text-emerald-600 dark:text-emerald-400 font-mono">IRouteProvider</code> interface, ready for future drop-in Mapbox Directions or OSRM vector routing in Phase 9.
          </p>
        </div>
      </div>
    </div>
  );
}
