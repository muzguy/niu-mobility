'use client';

import React from 'react';
import Link from 'next/link';
import { Leaf, ArrowUpRight, Droplet, Users, Clock } from 'lucide-react';
import { calculateSustainabilityScore } from '@/lib/emissions/emissions-engine';

export function ImpactSummary() {
  const scoreData = calculateSustainabilityScore();

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0f1523]/80 p-5 backdrop-blur-sm h-full flex flex-col justify-between shadow-xs dark:shadow-none transition-colors duration-150">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sustainability Impact</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Avoided carbon emissions & resource savings</p>
            </div>
          </div>

          <Link
            href="/impact"
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* NIU Impact Score Hero Card */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
              NIU IMPACT SCORE
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {scoreData.overallScore}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">/ 100</span>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 mt-1 font-medium">{scoreData.ratingBadge}</p>
          </div>

          {/* Radial progress visualizer */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 dark:text-emerald-400 transition-all duration-1000"
                strokeDasharray={`${scoreData.overallScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-mono font-bold text-slate-900 dark:text-slate-200">
              {scoreData.overallScore}%
            </span>
          </div>
        </div>

        {/* Key Dividend Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] mb-1">
              <Droplet className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Fuel Saved</span>
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-200 text-sm">788 Liters</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Thermal burn averted</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Solo Trips Cut</span>
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-200 text-sm">342 Vehicles</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Removed from corridors</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Idle Reduced</span>
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-200 text-sm">42.8 Hours</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">At red light phases</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] mb-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CO2 Avoided</span>
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-200 text-sm">1.82 Metric Tons</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Across urban grid</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-500">
        <span>Accounting Basis: IPCC Tier 1</span>
        <span className="font-mono text-emerald-700 dark:text-emerald-400/80 font-semibold">SIMULATED ESTIMATE</span>
      </div>
    </div>
  );
}
