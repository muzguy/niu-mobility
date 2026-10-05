'use client';

import React from 'react';
import { MapPin, Sparkles, AlertTriangle } from 'lucide-react';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

interface MapStatusProps {
  zoneName: string;
  radiusMeters: number;
  roadCount: number;
  intersectionCount: number;
  simulationMode: SimulationTrafficMode;
  lastSimulatedAt?: string;
  className?: string;
}

export function MapStatus({
  zoneName,
  radiusMeters,
  roadCount,
  intersectionCount,
  simulationMode,
  lastSimulatedAt,
  className = '',
}: MapStatusProps) {
  const formatTime = (iso?: string) => {
    if (!iso) return 'Synchronized';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Synchronized';
    }
  };

  return (
    <div
      className={`bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs shadow-md pointer-events-auto transition-all ${className}`}
    >
      {/* Zone Header & Scenario Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px] sm:text-xs">
            {zoneName}
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
            ({radiusMeters}m)
          </span>
        </div>

        {simulationMode === 'normal' && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold shrink-0">
            NORMAL FLOW
          </span>
        )}
        {simulationMode === 'rush_hour' && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>RUSH HOUR (+35%)</span>
          </span>
        )}
        {simulationMode === 'emergency' && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-semibold animate-pulse shrink-0">
            EVP CORRIDOR ACTIVE
          </span>
        )}
        {simulationMode === 'optimized' && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1 shrink-0">
            <Sparkles className="w-2.5 h-2.5" />
            <span>WEBSTER BALANCED</span>
          </span>
        )}
      </div>

      {/* Explicit Data Availability Indicators */}
      <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] font-mono">
        <div className="p-1 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col">
          <span className="text-[9px] text-slate-400">Road Network</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">REAL · OSM</span>
        </div>
        <div className="p-1 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col">
          <span className="text-[9px] text-slate-400">Traffic Flow</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">SIMULATED</span>
        </div>
        <div className="p-1 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col">
          <span className="text-[9px] text-slate-400">Sensors</span>
          <span className="font-medium text-slate-500">DISCONNECTED</span>
        </div>
      </div>

      {/* Telemetry Summary Footnote */}
      <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400 font-mono">
        <span>{roadCount} Roads • {intersectionCount} Junctions</span>
        <span>Sim: {formatTime(lastSimulatedAt)}</span>
      </div>
    </div>
  );
}
