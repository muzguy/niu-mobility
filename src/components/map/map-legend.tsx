'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

export function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 pointer-events-auto shadow-md transition-all">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-emerald-500" />
          <span className="font-bold text-slate-800 dark:text-slate-200">Map Legend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">SIMULATION</span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label={collapsed ? 'Expand legend' : 'Collapse legend'}
          >
            {collapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-2 mt-2">
          {/* Traffic Density States */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full bg-[#10b981]"></span>
              <span>Free Flow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full bg-[#f59e0b]"></span>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full bg-[#f97316]"></span>
              <span>Congested</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full bg-[#ef4444]"></span>
              <span>Severe Delay</span>
            </div>
          </div>

          {/* Infrastructure & Intelligence Markers */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-mono border-t border-slate-100 dark:border-slate-800/80 pt-1.5 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#06b6d4] ring-2 ring-[#06b6d4]/30"></span>
              <span>Junction Node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
              <span>Sim Vehicle</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2.5 h-1 rounded-full bg-[#f43f5e] animate-pulse"></span>
              <span>EVP Priority Corridor</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 dark:text-slate-500 italic pt-0.5">
            Click any road or junction node to inspect telemetry
          </div>
        </div>
      )}
    </div>
  );
}
