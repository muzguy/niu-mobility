'use client';

import React from 'react';
import { useSimulation } from '@/context/simulation-context';
import { getCongestionBadgeClass } from '@/lib/utils';
import { ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function TrafficOverview() {
  const { intersections, selectIntersection, selectedIntersection } = useSimulation();

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f1523]/80 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100">Arterial Intersections</h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              GREATER NOIDA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry and directional queuing across 5 monitored nodes
          </p>
        </div>

        <Link
          href="/traffic"
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
        >
          <span>Open Full Traffic Console</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Intersections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {intersections.map((node) => {
          const badge = getCongestionBadgeClass(node.congestionLevel);
          const isSelected = selectedIntersection?.id === node.id;

          return (
            <div
              key={node.id}
              onClick={() => selectIntersection(node.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-slate-200 truncate">{node.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                  {badge.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs my-2.5 py-2 border-y border-slate-800/60 bg-slate-950/30 rounded">
                <div>
                  <div className="text-slate-400 text-[10px]">Vehicles</div>
                  <div className="font-mono font-semibold text-slate-200 mt-0.5">{node.vehicleCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Avg Speed</div>
                  <div className="font-mono font-semibold text-slate-200 mt-0.5">{node.averageSpeedKmH} km/h</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Queue</div>
                  <div className="font-mono font-semibold text-slate-200 mt-0.5">{node.queueLengthMeters} m</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Wait: {node.waitingTimeMinutes} min</span>
                </div>
                {node.lastOptimizedAt ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Optimized {node.lastOptimizedAt}</span>
                  </span>
                ) : (
                  <span className="text-slate-500 text-[10px]">Default Timing</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
