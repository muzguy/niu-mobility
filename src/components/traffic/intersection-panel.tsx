'use client';

import React, { useState } from 'react';
import { Intersection, OptimizationResult } from '@/types/traffic';
import { SignalTiming } from './signal-timing';
import { OptimizationResultModal } from './optimization-result';
import { optimizeSignalTiming } from '@/lib/traffic/signal-optimizer';
import { useSimulation } from '@/context/simulation-context';
import { getCongestionBadgeClass } from '@/lib/utils';
import { Clock, Gauge, Car, ShieldAlert, Sparkles } from 'lucide-react';

import { apiOptimizeSignal } from '@/lib/api-client';

interface IntersectionPanelProps {
  intersection: Intersection;
}

export function IntersectionPanel({ intersection }: IntersectionPanelProps) {
  const { applySignalOptimization } = useSimulation();
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const badge = getCongestionBadgeClass(intersection.congestionLevel);

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    const input = {
      intersectionId: intersection.id,
      vehicleDensity: intersection.vehicleCount,
      queueLength: intersection.queueLengthMeters,
      waitingTime: intersection.waitingTimeMinutes,
      currentTiming: intersection.signalTiming,
      signals: intersection.signals,
    };

    try {
      const res = await apiOptimizeSignal(input);
      if (res.success && res.data) {
        setOptimizationResult(res.data);
      } else {
        const result = optimizeSignalTiming(input);
        setOptimizationResult(result);
      }
    } catch {
      const result = optimizeSignalTiming(input);
      setOptimizationResult(result);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApply = () => {
    if (optimizationResult) {
      applySignalOptimization(optimizationResult.intersectionId, optimizationResult.recommendedTiming);
      setOptimizationResult(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/90 p-5 shadow-xs backdrop-blur-sm space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              {intersection.name}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.label}
            </span>
            {intersection.isEmergencyPrioritized && (
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 animate-pulse flex items-center gap-1 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>EVP PRIORITY</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{intersection.description}</p>
        </div>

        {/* Optimize Button */}
        <button
          onClick={handleRunOptimizer}
          disabled={isOptimizing}
          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 text-emerald-200 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'COMPUTING WEBSTER...' : 'OPTIMIZE SIGNAL'}</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
            <Car className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Vehicles</span>
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {intersection.vehicleCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Active approaching</div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
            <Gauge className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Average Speed</span>
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-300">
            {intersection.averageSpeedKmH} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">km/h</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Throughput velocity</div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Queue Length</span>
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-600 dark:text-amber-300">
            {intersection.queueLengthMeters} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">m</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Max lane backup</div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Waiting Time</span>
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-rose-600 dark:text-rose-300">
            {intersection.waitingTimeMinutes} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">min</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Average delay per vehicle</div>
        </div>
      </div>

      {/* Directional Signal Breakdown */}
      <div className="pt-2">
        <SignalTiming
          signals={intersection.signals}
          signalTiming={intersection.signalTiming}
          isEmergencyPrioritized={intersection.isEmergencyPrioritized}
        />
      </div>

      {/* Modal Dialog for Optimization Results */}
      <OptimizationResultModal
        result={optimizationResult}
        onApply={handleApply}
        onClose={() => setOptimizationResult(null)}
      />
    </div>
  );
}
