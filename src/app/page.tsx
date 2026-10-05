'use client';

import React from 'react';
import { useSimulation } from '@/context/simulation-context';
import { MetricCard } from '@/components/dashboard/metric-card';
import { MobilityMap } from '@/components/map/mobility-map';
import { IntersectionPanel } from '@/components/traffic/intersection-panel';
import { TrafficOverview } from '@/components/dashboard/traffic-overview';
import { MobilityActivity } from '@/components/dashboard/mobility-activity';
import { ImpactSummary } from '@/components/dashboard/impact-summary';
import { Activity, Car, Leaf, Clock, Siren } from 'lucide-react';

export default function CommandCenterPage() {
  const {
    metrics,
    selectedIntersection,
    emergencyCorridor,
    triggerEmergency,
    isRushHour,
    toggleRushHour,
  } = useSimulation();

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Mobility Command Center
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ● SIMULATION MODE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time urban telemetry, adaptive signal balancing & shared transit coordination
          </p>
        </div>

        {/* Quick Simulation Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={toggleRushHour}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isRushHour
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isRushHour ? 'Rush Hour (+35%) Active' : 'Simulate Rush Hour'}
          </button>

          <button
            onClick={triggerEmergency}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              emergencyCorridor.active
                ? 'bg-rose-500/25 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400'
            }`}
          >
            <Siren className="w-3.5 h-3.5 text-rose-400" />
            <span>{emergencyCorridor.active ? 'Halt EVP Run' : 'Simulate Emergency Vehicle'}</span>
          </button>
        </div>
      </div>

      {/* TOP METRICS (Required: Traffic Load 68%, Active Trips 342, Estimated CO2 1.82 t, Average Delay 14 min) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Traffic Load"
          value={metrics.trafficLoadPct}
          unit="%"
          change={isRushHour ? '+18% during peak' : '-4% from average'}
          changeType={isRushHour ? 'negative' : 'positive'}
          icon={Activity}
          accentColor={metrics.trafficLoadPct > 75 ? 'rose' : metrics.trafficLoadPct > 55 ? 'amber' : 'green'}
          description="Monitored arterial capacity"
        />

        <MetricCard
          label="Active Trips"
          value={metrics.activeTrips}
          unit="trips"
          change="342 Active vehicles"
          changeType="neutral"
          icon={Car}
          accentColor="cyan"
          description="In transit across grid"
        />

        <MetricCard
          label="Estimated CO2 Saved"
          value={metrics.estimatedCo2SavedTons}
          unit="t"
          change="+0.32 t today"
          changeType="positive"
          icon={Leaf}
          accentColor="green"
          description="IPCC modeled mitigation"
        />

        <MetricCard
          label="Average Delay"
          value={metrics.averageDelayMinutes}
          unit="min"
          change="-3.2 min vs baseline"
          changeType="positive"
          icon={Clock}
          accentColor={metrics.averageDelayMinutes > 18 ? 'rose' : 'amber'}
          description="Intersection delay index"
        />
      </div>

      {/* MAIN AREA: Interactive Simulated Mobility Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100">Live Simulated Mobility Grid</h2>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              GREATER NOIDA NETWORK
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
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
