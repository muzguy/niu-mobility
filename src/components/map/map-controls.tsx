import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Siren, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const { simulationMode, setSimulationMode } = useSimulation();

  return (
    <div className="flex flex-col gap-2 pointer-events-auto">
      {/* Zoom Controls */}
      <div className="bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex flex-col gap-1 shadow-md">
        <button
          onClick={onZoomIn}
          disabled={zoom >= 1.6}
          title="Zoom In"
          aria-label="Zoom in map"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.8}
          title="Zoom Out"
          aria-label="Zoom out map"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          title="Reset Map View"
          aria-label="Reset map view"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors border-t border-slate-200 dark:border-slate-800 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 flex flex-col gap-1 shadow-md text-[11px] text-slate-700 dark:text-slate-300">
        <button
          onClick={onToggleTrafficFlow}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            showTrafficFlow
              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-medium'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Flow Pulses</span>
        </button>

        <button
          onClick={onToggleSignalStates}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            showSignalStates
              ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 font-medium'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          <span>Signal Badges</span>
        </button>
      </div>

      {/* Simulation Scenario Driver Controls (Normal, Rush Hour, EVP, Optimized) */}
      <div className="bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 flex flex-col gap-1 shadow-md text-[11px]">
        <div className="px-1 text-[9px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
          Sim Mode
        </div>

        {/* Normal Mode */}
        <button
          onClick={() => setSimulationMode('normal')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            simulationMode === 'normal'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Normal</span>
        </button>

        {/* Rush Hour Mode */}
        <button
          onClick={() => setSimulationMode('rush_hour')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            simulationMode === 'rush_hour'
              ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Rush Hour</span>
        </button>

        {/* Emergency Mode */}
        <button
          onClick={() => setSimulationMode('emergency')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            simulationMode === 'emergency'
              ? 'bg-rose-50 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/50 animate-pulse font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
          }`}
        >
          <Siren className="w-3.5 h-3.5 text-rose-500" />
          <span>Emergency</span>
        </button>

        {/* Optimized Mode */}
        <button
          onClick={() => setSimulationMode('optimized')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
            simulationMode === 'optimized'
              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/50 font-semibold shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Optimized</span>
        </button>
      </div>
    </div>
  );
}
