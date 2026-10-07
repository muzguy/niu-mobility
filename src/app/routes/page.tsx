'use client';

import React from 'react';
import { useSimulation } from '@/context/simulation-context';
import { RouteComparison } from '@/components/routes/route-comparison';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Leaf, Clock, Gauge } from 'lucide-react';

export default function RoutesPage() {
  const { mobilityState, simulationMode } = useSimulation();

  // Deterministically derived profile durations from active simulation travel time
  const fastestDuration = Math.max(12, Math.round(mobilityState.travelTimeMinutes * 0.92));
  const balancedDuration = Math.max(14, Math.round(mobilityState.travelTimeMinutes * 1.05));
  const greenestDuration = Math.max(16, Math.round(mobilityState.travelTimeMinutes * 1.14));

  const fastestChange =
    simulationMode === 'rush_hour'
      ? 'High Arterial Congestion'
      : simulationMode === 'optimized'
      ? 'Signal Green Waves Active'
      : simulationMode === 'emergency'
      ? 'Corridor Pre-empted'
      : 'Nominal Radial Flow';

  const balancedChange =
    simulationMode === 'rush_hour'
      ? 'Optimal Bypass Recommended'
      : simulationMode === 'optimized'
      ? 'Synchronized Arterials'
      : 'Steady Flow / Optimal';

  const greenestChange =
    simulationMode === 'optimized'
      ? '-46% Lower Emissions'
      : simulationMode === 'rush_hour'
      ? `-${Math.round(mobilityState.co2SavedTons * 10 + 22)}% Idle CO2 Saved`
      : '-38% Lower Emissions';

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Smart Route Optimization & Eco-Navigation
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              TRAFFIC-AWARE GRAPH ENGINE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Traffic-aware route optimization using real OSM road geometry and NIU&apos;s deterministic mobility simulation.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          Scenario: <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{simulationMode.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Fastest Profile"
          value={fastestDuration}
          unit="min"
          change={fastestChange}
          changeType={simulationMode === 'rush_hour' ? 'negative' : 'positive'}
          icon={Clock}
          accentColor="rose"
          description="Direct radial spine"
        />

        <MetricCard
          label="Balanced Profile"
          value={balancedDuration}
          unit="min"
          change={balancedChange}
          changeType="neutral"
          icon={Gauge}
          accentColor="cyan"
          description="Bypasses Pari Chowk bottleneck"
        />

        <MetricCard
          label="Greenest Profile"
          value={greenestDuration}
          unit="min"
          change={greenestChange}
          changeType="positive"
          icon={Leaf}
          accentColor="green"
          description="Steady velocity eco-corridor"
        />
      </div>

      {/* Main Route Comparison Component */}
      <div>
        <RouteComparison />
      </div>
    </div>
  );
}
