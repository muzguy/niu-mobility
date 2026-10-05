'use client';

import React from 'react';
import { useSimulation } from '@/context/simulation-context';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TrafficChart } from '@/components/traffic/traffic-chart';
import { IntersectionPanel } from '@/components/traffic/intersection-panel';
import { Activity, Gauge, Clock, Info, Layers } from 'lucide-react';

export default function TrafficPage() {
  const { intersections, metrics, selectedIntersection, selectIntersection } = useSimulation();

  // Aggregate stats across monitored intersections
  const avgQueue = Math.round(
    intersections.reduce((acc, curr) => acc + curr.queueLengthMeters, 0) / intersections.length
  );
  const avgWait = Number(
    (intersections.reduce((acc, curr) => acc + curr.waitingTimeMinutes, 0) / intersections.length).toFixed(1)
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Traffic Intelligence & Signal Optimization
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SIMULATED ESTIMATE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Arterial density monitoring, queue detection & deterministic Webster-based adaptive signal balancing
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          Monitored Nodes: <span className="text-emerald-400 font-bold">{intersections.length} Intersections</span>
        </div>
      </div>

      {/* TOP STATS: Traffic Load, Average Speed, Queue Length, Waiting Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Traffic Load"
          value={metrics.trafficLoadPct}
          unit="%"
          change="Arterial congestion"
          changeType={metrics.trafficLoadPct > 70 ? 'negative' : 'neutral'}
          icon={Activity}
          accentColor={metrics.trafficLoadPct > 70 ? 'rose' : 'amber'}
        />

        <MetricCard
          label="Average Speed"
          value={metrics.averageSpeedKmH}
          unit="km/h"
          change="Corridor velocity"
          changeType="positive"
          icon={Gauge}
          accentColor="cyan"
        />

        <MetricCard
          label="Queue Length"
          value={avgQueue}
          unit="m"
          change="Mean directional backup"
          changeType="neutral"
          icon={Layers}
          accentColor="amber"
        />

        <MetricCard
          label="Waiting Time"
          value={avgWait}
          unit="min"
          change="Red phase delay"
          changeType="positive"
          icon={Clock}
          accentColor="rose"
        />
      </div>

      {/* 24-Hour Traffic Trend Chart (Recharts) */}
      <div className="rounded-xl border border-slate-800 bg-[#0f1523]/80 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-slate-100">Hourly Traffic Volume & Speed Profile</h2>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            SIMULATION TREND
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Peak morning rush (08:00 - 10:00) and evening return (17:00 - 19:30) density curves
        </p>

        <TrafficChart height={280} />
      </div>

      {/* Intersection Node Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Intersection Signal Controllers</h2>
          <span className="text-xs text-slate-400">Select a junction to inspect directional timings</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {intersections.map((node) => {
            const isSelected = selectedIntersection?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => selectIntersection(node.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{node.shortName}</span>
                <span className="ml-1.5 text-[10px] font-mono text-slate-500">({node.vehicleCount}v)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Selected Intersection Detailed Panel with OPTIMIZE SIGNAL button */}
      {selectedIntersection && (
        <div>
          <IntersectionPanel intersection={selectedIntersection} />
        </div>
      )}

      {/* Grid of All Intersection Cards */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
          All Monitored Intersections (Detailed Telemetry)
        </h3>

        <div className="space-y-4">
          {intersections.map((node) => (
            <IntersectionPanel key={node.id} intersection={node} />
          ))}
        </div>
      </div>

      {/* Legal & System Simulation Disclaimer */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>SIMULATED ESTIMATE NOTICE:</strong> Signal optimization algorithms compute theoretical green-split allocations based on queue density and Webster minimum-delay equations. This prototype demonstrates software architecture and telemetry modeling. It does not exert physical control over municipal traffic signal hardware.
        </p>
      </div>
    </div>
  );
}
