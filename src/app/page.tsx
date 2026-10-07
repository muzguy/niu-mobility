'use client';

import React, { useMemo } from 'react';
import { useSimulation } from '@/context/simulation-context';
import { MetricCard } from '@/components/dashboard/metric-card';
import { MobilityMap } from '@/components/map/mobility-map';
import { IntersectionPanel } from '@/components/traffic/intersection-panel';
import { TrafficOverview } from '@/components/dashboard/traffic-overview';
import { MobilityActivity } from '@/components/dashboard/mobility-activity';
import { ImpactSummary } from '@/components/dashboard/impact-summary';
import { Activity, Car, Leaf, Clock, Siren, BarChart2 } from 'lucide-react';
import { calculateMobilityState } from '@/lib/simulation/unified-simulation-state';

export default function CommandCenterPage() {
  const {
    mobilityState,
    simulationMode,
    selectedIntersection,
    emergencyCorridor,
    triggerEmergency,
    isRushHour,
    toggleRushHour,
  } = useSimulation();

  const normalState = useMemo(() => calculateMobilityState({ scenario: 'normal' }), []);
  const delayDelta = (mobilityState.averageDelayMinutes - normalState.averageDelayMinutes).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Mobility Command Center
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-semibold">
              ● SIMULATION MODE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time urban telemetry, adaptive signal balancing & shared transit coordination
          </p>
        </div>

        {/* Quick Simulation Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={toggleRushHour}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isRushHour
                ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-semibold'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isRushHour ? 'Rush Hour (+55%) Active' : 'Simulate Rush Hour'}
          </button>

          <button
            onClick={triggerEmergency}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              emergencyCorridor.active
                ? 'bg-rose-50 dark:bg-rose-500/25 border-rose-300 dark:border-rose-500 text-rose-700 dark:text-rose-200 animate-pulse font-semibold'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Siren className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>{emergencyCorridor.active ? 'Halt EVP Run' : 'Simulate Emergency Vehicle'}</span>
          </button>
        </div>
      </div>

      {/* TOP METRICS (Wired directly to unified mobilityState) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Traffic Load"
          value={mobilityState.trafficLoadPct}
          unit="%"
          change={isRushHour ? '+26% during peak' : mobilityState.trafficLoadPct < 40 ? '-14% vs normal' : '-4% from average'}
          changeType={mobilityState.trafficLoadPct > 65 ? 'negative' : 'positive'}
          icon={Activity}
          accentColor={mobilityState.trafficLoadPct > 70 ? 'rose' : mobilityState.trafficLoadPct > 50 ? 'amber' : 'green'}
          description="Monitored arterial capacity"
        />

        <MetricCard
          label="Active Trips"
          value={mobilityState.totalVehicles}
          unit="trips"
          change={`${mobilityState.totalVehicles} active vehicles`}
          changeType="neutral"
          icon={Car}
          accentColor="cyan"
          description="In transit across grid"
        />

        <MetricCard
          label="Estimated CO2 Saved"
          value={mobilityState.co2SavedTons}
          unit="t"
          change={`+${(mobilityState.co2SavedTons * 0.22).toFixed(2)} t today`}
          changeType="positive"
          icon={Leaf}
          accentColor="green"
          description="IPCC modeled mitigation"
        />

        <MetricCard
          label="Average Delay"
          value={mobilityState.averageDelayMinutes}
          unit="min"
          change={`${Number(delayDelta) > 0 ? '+' + delayDelta : delayDelta} min vs baseline`}
          changeType={Number(delayDelta) > 0 ? 'negative' : 'positive'}
          icon={Clock}
          accentColor={mobilityState.averageDelayMinutes > 7.0 ? 'rose' : 'amber'}
          description="Intersection delay index"
        />
      </div>

      {/* SCENARIO IMPACT COMPARISON (NORMAL vs CURRENT SCENARIO) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200">
              Scenario Impact Comparison
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-semibold">
              NORMAL vs {simulationMode.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Deterministic delta calculated across {mobilityState.intersections.length} monitored junctions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Average Speed</div>
            <div className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{normalState.averageSpeedKmH} km/h</span>
              <span className="text-slate-400">→</span>
              <span className={mobilityState.averageSpeedKmH < normalState.averageSpeedKmH ? 'text-rose-600 dark:text-rose-400' : mobilityState.averageSpeedKmH > normalState.averageSpeedKmH ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                {mobilityState.averageSpeedKmH} km/h
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {mobilityState.averageSpeedKmH - normalState.averageSpeedKmH > 0 ? `+${(mobilityState.averageSpeedKmH - normalState.averageSpeedKmH).toFixed(1)} km/h` : `${(mobilityState.averageSpeedKmH - normalState.averageSpeedKmH).toFixed(1)} km/h`}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Average Delay</div>
            <div className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{normalState.averageDelayMinutes} min</span>
              <span className="text-slate-400">→</span>
              <span className={mobilityState.averageDelayMinutes > normalState.averageDelayMinutes ? 'text-rose-600 dark:text-rose-400' : mobilityState.averageDelayMinutes < normalState.averageDelayMinutes ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                {mobilityState.averageDelayMinutes} min
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {mobilityState.averageDelayMinutes - normalState.averageDelayMinutes > 0 ? `+${(mobilityState.averageDelayMinutes - normalState.averageDelayMinutes).toFixed(1)} min` : `${(mobilityState.averageDelayMinutes - normalState.averageDelayMinutes).toFixed(1)} min`}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total CO2</div>
            <div className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{(normalState.co2Kg / 1000).toFixed(1)} t</span>
              <span className="text-slate-400">→</span>
              <span className={mobilityState.co2Kg > normalState.co2Kg ? 'text-rose-600 dark:text-rose-400' : mobilityState.co2Kg < normalState.co2Kg ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                {(mobilityState.co2Kg / 1000).toFixed(1)} t
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {mobilityState.co2Kg - normalState.co2Kg > 0 ? `+${((mobilityState.co2Kg - normalState.co2Kg)/1000).toFixed(2)} t` : `${((mobilityState.co2Kg - normalState.co2Kg)/1000).toFixed(2)} t`}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">NIU Mobility Score</div>
            <div className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{normalState.niuScore}</span>
              <span className="text-slate-400">→</span>
              <span className={mobilityState.niuScore < normalState.niuScore ? 'text-rose-600 dark:text-rose-400' : mobilityState.niuScore > normalState.niuScore ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                {mobilityState.niuScore}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {mobilityState.niuScore - normalState.niuScore > 0 ? `+${mobilityState.niuScore - normalState.niuScore} pts` : `${mobilityState.niuScore - normalState.niuScore} pts`}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN AREA: Interactive Simulated Mobility Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Live Simulated Mobility Grid</h2>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              GREATER NOIDA NETWORK
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Click any intersection node on the canvas to inspect directional signals
          </span>
        </div>

        {/* Vector SVG Canvas Component */}
        <MobilityMap heightClass="h-[480px] sm:h-[540px]" />
      </div>

      {/* Selected Intersection Inspection Panel (Opens when node clicked) */}
      {selectedIntersection && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-200">
          <IntersectionPanel intersection={selectedIntersection} />
        </div>
      )}

      {/* Secondary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monitored Intersections Overview */}
        <div className="lg:col-span-8">
          <TrafficOverview />
        </div>

        {/* Real-Time Simulation Activity Feed */}
        <div className="lg:col-span-4">
          <MobilityActivity />
        </div>
      </div>

      {/* Bottom Row: Sustainability Impact Summary */}
      <div>
        <ImpactSummary />
      </div>
    </div>
  );
}
