'use client';

import React from 'react';
import { useSimulation } from '@/context/simulation-context';
import { Radio, Users, Siren, Leaf, AlertTriangle } from 'lucide-react';

export function MobilityActivity() {
  const { events } = useSimulation();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'signal':
        return <Radio className="w-3.5 h-3.5 text-emerald-400" />;
      case 'carpool':
        return <Users className="w-3.5 h-3.5 text-cyan-400" />;
      case 'emergency':
        return <Siren className="w-3.5 h-3.5 text-rose-400" />;
      case 'sustainability':
        return <Leaf className="w-3.5 h-3.5 text-emerald-400" />;
      case 'traffic':
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f1523]/80 p-5 backdrop-blur-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-100">Mobility Event Stream</h2>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          SIMULATED LOG
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[360px]">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 text-xs space-y-1 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-slate-800/80">{getCategoryIcon(evt.category)}</div>
                <span className="font-semibold text-slate-200">{evt.title}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{evt.timestamp}</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed pl-7">{evt.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
