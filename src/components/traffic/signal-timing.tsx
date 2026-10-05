'use client';

import React from 'react';
import { DirectionalSignal, Direction } from '@/types/traffic';
import { ArrowUp, ArrowDown, ArrowRight, ArrowLeft } from 'lucide-react';

interface SignalTimingProps {
  signals: DirectionalSignal[];
  signalTiming: Record<Direction, number>;
  isEmergencyPrioritized?: boolean;
}

export function SignalTiming({ signals, signalTiming, isEmergencyPrioritized }: SignalTimingProps) {
  const getDirectionIcon = (dir: Direction) => {
    switch (dir) {
      case 'north':
        return <ArrowUp className="w-3.5 h-3.5" />;
      case 'south':
        return <ArrowDown className="w-3.5 h-3.5" />;
      case 'east':
        return <ArrowRight className="w-3.5 h-3.5" />;
      case 'west':
        return <ArrowLeft className="w-3.5 h-3.5" />;
    }
  };

  const directions: Direction[] = ['north', 'south', 'east', 'west'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400 font-medium">Directional Green Split</span>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">CYCLE DURATION: ~120s</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {directions.map((dir) => {
          const sig = signals.find((s) => s.direction === dir);
          const greenSec = signalTiming[dir] || 30;
          const isGreen = isEmergencyPrioritized
            ? dir === 'north' || dir === 'south'
            : sig?.state === 'green';

          return (
            <div
              key={dir}
              className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                isGreen
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 capitalize font-medium text-slate-800 dark:text-slate-200">
                  {getDirectionIcon(dir)}
                  <span>{dir}</span>
                </div>
                {/* Traffic light circular indicator */}
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isGreen ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500/80'
                    }`}
                  ></span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{greenSec}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">sec green</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-500">
                  <span>{sig ? `${sig.queueLengthMeters}m queue` : 'Normal flow'}</span>
                  <span>{sig ? `${sig.vehicleCount}v` : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
