'use client';

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  CircleDot,
  Car,
  Siren,
  Play,
  Pause,
} from 'lucide-react';
import { MapLayerToggles } from '@/types/map';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetBounds: () => void;
  layers: MapLayerToggles;
  onToggleLayer: (key: keyof MapLayerToggles) => void;
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
  onResetSimulation?: () => void;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onResetBounds,
  layers,
  onToggleLayer,
  isSimulating = true,
  onToggleSimulate,
  onResetSimulation,
}: MapControlsProps) {
  return (
    <div className="flex flex-col gap-2 pointer-events-auto">
      {/* Simulation Playback & Replay Controls */}
      {onToggleSimulate && (
        <div className="bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex items-center justify-center gap-1 shadow-md">
          <button
            onClick={onToggleSimulate}
            title={isSimulating ? 'Pause Simulation' : 'Start Simulation'}
            aria-label={isSimulating ? 'Pause simulation' : 'Start simulation'}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isSimulating
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          {onResetSimulation && (
            <button
              onClick={onResetSimulation}
              title="Replay / Reset Simulation Timeline"
              aria-label="Replay simulation"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Zoom & Recenter Controls */}
      <div className="bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex flex-col gap-1 shadow-md">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          aria-label="Zoom in map"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          aria-label="Zoom out map"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onResetBounds}
          title="Fit to Mobility Zone"
          aria-label="Fit to Mobility Zone"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors border-t border-slate-200 dark:border-slate-800 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 flex flex-col gap-1 shadow-md text-[11px]">
        <button
          onClick={() => onToggleLayer('showTraffic')}
          title="Toggle Traffic Density Lines"
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            layers.showTraffic
              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-medium'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Traffic Overlay</span>
        </button>

        <button
          onClick={() => onToggleLayer('showIntersections')}
          title="Toggle Monitored Junction Nodes"
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            layers.showIntersections
              ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 font-medium'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Intersections</span>
        </button>

        <button
          onClick={() => onToggleLayer('showVehicles')}
          title="Toggle Simulated Vehicle Movement"
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            layers.showVehicles
              ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 font-medium'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sim Vehicles</span>
        </button>

        <button
          onClick={() => onToggleLayer('showEmergency')}
          title="Toggle Emergency Pre-emption Corridor"
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            layers.showEmergency
              ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-medium'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Siren className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">EVP Corridor</span>
        </button>
      </div>
    </div>
  );
}
