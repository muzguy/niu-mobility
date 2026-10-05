import React from 'react';

export function MapLegend() {
  return (
    <div className="bg-[#0b0f19]/90 backdrop-blur-sm border border-slate-800 rounded-lg p-3 text-xs text-slate-300 space-y-2 pointer-events-auto">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
        <span>Map Legend</span>
        <span className="text-emerald-400 font-bold">SIMULATION</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
        {/* Low Congestion */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Low Traffic (40+ km/h)</span>
        </div>

        {/* Moderate Congestion */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Moderate (25-40 km/h)</span>
        </div>

        {/* Severe Congestion */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Severe (&lt; 25 km/h)</span>
        </div>

        {/* Emergency Wave */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Emergency Corridor</span>
        </div>
      </div>

      <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Intersections: Click node to inspect</span>
        <span>Grid: Greater Noida</span>
      </div>
    </div>
  );
}
