'use client';

import React from 'react';
import { OptimizationResult } from '@/types/traffic';
import { X, ShieldCheck, Zap, Leaf, Clock, Radio } from 'lucide-react';

interface OptimizationResultModalProps {
  result: OptimizationResult | null;
  onApply: () => void;
  onClose: () => void;
}

export function OptimizationResultModal({ result, onApply, onClose }: OptimizationResultModalProps) {
  if (!result) return null;

  const directions = ['north', 'south', 'east', 'west'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0f1523] p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="modal-headline" className="text-base font-bold text-slate-100">
                  Signal Optimization Computed
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  SIMULATED ESTIMATE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{result.intersectionName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Projected Impact Cards */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Wait Time</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
              -{result.waitingTimeReductionPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Estimated reduction</div>
          </div>

          <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20">
            <div className="text-[10px] uppercase font-mono text-cyan-400 font-semibold flex items-center justify-center gap-1">
              <Radio className="w-3 h-3" />
              <span>Queue Length</span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              -{result.queueReductionPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Queue clearance</div>
          </div>

          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20">
            <div className="text-[10px] uppercase font-mono text-amber-400 font-semibold flex items-center justify-center gap-1">
              <Leaf className="w-3 h-3" />
              <span>CO2 Saved</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {result.estimatedCo2SavedKg} kg
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">From averted idling</div>
          </div>
        </div>

        {/* Timing Comparison Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Green Split Comparison (Webster Algorithm)
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {directions.map((dir) => {
              const prev = result.previousTiming[dir] || 30;
              const next = result.recommendedTiming[dir] || 30;
              const diff = next - prev;

              return (
                <div key={dir} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/50">
                  <div className="font-semibold text-slate-300 uppercase text-[10px] mb-1">{dir}</div>
                  <div className="text-xs text-slate-400 line-through font-mono">{prev}s</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <span>{next}s</span>
                  </div>
                  <div
                    className={`text-[10px] font-mono mt-1 ${
                      diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {diff > 0 ? `+${diff}s` : diff < 0 ? `${diff}s` : '0s'}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            {result.summaryExplanation}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Apply Timing to Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
