'use client';

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Siren, Flame } from 'lucide-react';
import { useSimulation } from '@/context/simulation-context';

interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  showTrafficFlow: boolean;
  onToggleTrafficFlow: () => void;
  showSignalStates: boolean;
  onToggleSignalStates: () => void;
}

export function MapControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  showTrafficFlow,
  onToggleTrafficFlow,
  showSignalStates,
  onToggleSignalStates,
}: MapControlsProps) {
  const { isRushHour, emergencyCorridor, toggleRushHour, triggerEmergency } = useSimulation();

  return (
    <div className="flex flex-col gap-2 pointer-events-auto">
      {/* Zoom Controls */}
      <div className="bg-[#0b0f19]/90 backdrop-blur-sm border border-slate-800 rounded-lg p-1 flex flex-col gap-1 shadow-lg">
        <button
          onClick={onZoomIn}
          disabled={zoom >= 1.6}
          title="Zoom In"
          aria-label="Zoom in map"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.8}
          title="Zoom Out"
          aria-label="Zoom out map"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          title="Reset Map View"
          aria-label="Reset map view"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border-t border-slate-800"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="bg-[#0b0f19]/90 backdrop-blur-sm border border-slate-800 rounded-lg p-1.5 flex flex-col gap-1.5 shadow-lg text-[11px] text-slate-300">
        <button
          onClick={onToggleTrafficFlow}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            showTrafficFlow
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Flow Pulses</span>
        </button>

        <button
          onClick={onToggleSignalStates}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            showSignalStates
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Signal Badges</span>
        </button>
      </div>

      {/* Quick Simulation Action Buttons */}
      <div className="bg-[#0b0f19]/90 backdrop-blur-sm border border-slate-800 rounded-lg p-1.5 flex flex-col gap-1.5 shadow-lg text-[11px]">
        <button
          onClick={toggleRushHour}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            isRushHour
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Rush Hour ({isRushHour ? 'ON' : 'OFF'})</span>
        </button>

        <button
          onClick={triggerEmergency}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            emergencyCorridor.active
              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse'
              : 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'
          }`}
        >
          <Siren className="w-3.5 h-3.5" />
          <span>{emergencyCorridor.active ? 'End EVP' : 'Simulate EVP'}</span>
        </button>
      </div>
    </div>
  );
}
