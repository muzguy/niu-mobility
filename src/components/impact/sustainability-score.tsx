'use client';

import React from 'react';
import { calculateSustainabilityScore } from '@/lib/emissions/emissions-engine';
import { Info } from 'lucide-react';

export function SustainabilityScore() {
  const scoreData = calculateSustainabilityScore();
  const { breakdown } = scoreData;

  const categories = [
    breakdown.carpooling,
    breakdown.trafficOptimization,
    breakdown.routeEfficiency,
    breakdown.reducedIdleTime,
  ];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-6 shadow-xs backdrop-blur-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
              PERFORMANCE INDEX
            </span>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              PROTOTYPE ESTIMATE
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">NIU Impact Score</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{scoreData.summary}</p>
        </div>

        {/* Big Score Display */}
        <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 p-4 rounded-xl self-start sm:self-auto">
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {scoreData.overallScore}
              <span className="text-base font-normal text-slate-500 dark:text-slate-400">/100</span>
            </div>
            <div className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-semibold tracking-wider">
              {scoreData.ratingBadge}
            </div>
          </div>

          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold font-mono text-lg shadow-[0_0_12px_rgba(52,211,153,0.3)]">
            A
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300 font-mono">
          Index Component Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{cat.score} / 100</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${cat.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">{cat.metricLabel}</span>
                <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                  Weight: {Math.round(cat.weight * 100)}%
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed pt-1">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          The NIU Impact Score is synthesized from simulated mobility patterns across monitored Greater Noida corridors. All carbon values use standard IPCC Tier-1 greenhouse gas conversion models. Real sensor and PostGIS data ingestion will be enabled in Phase 9.
        </p>
      </div>
    </div>
  );
}
