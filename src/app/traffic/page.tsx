'use client';

import React from 'react';
import { useSimulation } from '@/context/simulation-context';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TrafficChart } from '@/components/traffic/traffic-chart';
import { IntersectionPanel } from '@/components/traffic/intersection-panel';
import { Activity, Gauge, Clock, Info, Layers, SlidersHorizontal } from 'lucide-react';
import { getCongestionBadgeClass } from '@/lib/utils';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { LocationSelector } from '@/components/geospatial/location-selector';
import { apiSetSimulationScenario, apiGetTrafficState } from '@/lib/api-client';
import { Intersection } from '@/types/traffic';

export default function TrafficPage() {
  const {
    intersections,
    metrics,
    selectedIntersection,
    selectIntersection,
    simulationMode,
    setSimulationMode,
  } = useSimulation();

  const [activeZoneId, setActiveZoneId] = React.useState('greater-noida-core');
  const [zoneTelemetry, setZoneTelemetry] = React.useState<{
    intersections: Intersection[];
    metrics: typeof metrics;
  } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadZoneData() {
      if (activeZoneId === 'greater-noida-core') {
        setZoneTelemetry(null);
        return;
      }
      try {
        const res = await apiGetTrafficState(activeZoneId);
        if (isMounted && res.success && res.data) {
          setZoneTelemetry({
            intersections: res.data.intersections,
            metrics: res.data.metrics,
          });
        }
      } catch {
        // Fallback to local
      }
    }

    loadZoneData();
    return () => {
      isMounted = false;
    };
  }, [activeZoneId, simulationMode]);

  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  const activeIntersections = zoneTelemetry ? zoneTelemetry.intersections : intersections;
  const activeMetrics = zoneTelemetry ? zoneTelemetry.metrics : metrics;
  const currentSelected =
    activeIntersections.find((i) => i.id === (selectedNodeId || selectedIntersection?.id)) ||
    activeIntersections[0] ||
    selectedIntersection;

  const handleScenarioChange = async (mode: SimulationTrafficMode) => {
    setSimulationMode(mode);
    try {
      await apiSetSimulationScenario(mode);
    } catch {
      // Graceful fallback to local simulation
    }
  };

  // Aggregate stats across active monitored intersections
  const avgQueue = Math.round(
    activeIntersections.reduce((acc, curr) => acc + curr.queueLengthMeters, 0) /
      (activeIntersections.length || 1)
  );
  const avgWait = Number(
    (
      activeIntersections.reduce((acc, curr) => acc + curr.waitingTimeMinutes, 0) /
      (activeIntersections.length || 1)
    ).toFixed(1)
  );

  const scenarioModes: { id: SimulationTrafficMode; label: string; desc: string; icon: string }[] = [
    { id: 'normal', label: 'Normal Flow', desc: 'Standard daytime pattern', icon: '🟢' },
    { id: 'rush_hour', label: 'Rush Hour', desc: 'Peak corridor density (1.6x)', icon: '🟠' },
    { id: 'emergency', label: 'Emergency EVP', desc: 'Pre-empted priority corridor', icon: '🚨' },
    { id: 'optimized', label: 'Webster Optimized', desc: 'Adaptive network-wide balancing', icon: '⚡' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Traffic Intelligence & Signal Optimization
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              SIMULATED ESTIMATE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Arterial density monitoring, queue detection & deterministic Webster-based adaptive signal balancing
          </p>
        </div>

        <div className="text-xs font-mono text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          Monitored Nodes: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activeIntersections.length} Intersections</span>
        </div>
      </div>

      {/* Geospatial Mobility Zone & OpenStreetMap Location Selector */}
      <LocationSelector
        activeZoneId={activeZoneId}
        onZoneSelect={(id) => {
          setActiveZoneId(id);
          setSelectedNodeId(null);
        }}
      />

      {/* Simulation Scenario Driver Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-4 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
              Simulation Scenario Driver
            </h2>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              ACTIVE: {simulationMode.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Triggers network-wide deterministic physics and Webster equations
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {scenarioModes.map((mode) => {
            const isActive = simulationMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleScenarioChange(mode.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{mode.icon}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  )}
                </div>
                <div className={`mt-2 font-semibold text-xs ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                  {mode.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {mode.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP STATS: Traffic Load, Average Speed, Queue Length, Waiting Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Traffic Load"
          value={activeMetrics.trafficLoadPct}
          unit="%"
          change="Arterial congestion"
          changeType={activeMetrics.trafficLoadPct > 70 ? 'negative' : 'neutral'}
          icon={Activity}
          accentColor={activeMetrics.trafficLoadPct > 70 ? 'rose' : 'amber'}
        />

        <MetricCard
          label="Average Speed"
          value={activeMetrics.averageSpeedKmH}
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-5 shadow-xs backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Hourly Traffic Volume & Speed Profile
          </h2>
          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
            SIMULATION TREND
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Peak morning rush (08:00 - 10:00) and evening return (17:00 - 19:30) density curves
        </p>

        <TrafficChart height={280} />
      </div>

      {/* Intersection Node Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Active Junction Inspector & Signal Controller
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Select a node to inspect and optimize directional green splits
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeIntersections.map((node) => {
            const isSelected = currentSelected?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  selectIntersection(node.id);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{node.shortName}</span>
                <span className="ml-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500">({node.vehicleCount}v)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Selected Intersection Detailed Panel with OPTIMIZE SIGNAL button */}
      {currentSelected && (
        <div className="transition-all">
          <IntersectionPanel intersection={currentSelected} />
        </div>
      )}

      {/* De-cluttered Monitored Intersections Network Overview Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-5 shadow-xs backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300 font-mono">
              Monitored Intersections Network Telemetry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status across all {activeIntersections.length} corridor sensor nodes
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            REAL-TIME TELEMETRY MATRIX
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">Intersection Node</th>
                <th className="py-2.5 px-3">Congestion</th>
                <th className="py-2.5 px-3 text-right">Approaching</th>
                <th className="py-2.5 px-3 text-right">Avg Speed</th>
                <th className="py-2.5 px-3 text-right">Queue</th>
                <th className="py-2.5 px-3 text-right">Wait Time</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {activeIntersections.map((node) => {
                const badge = getCongestionBadgeClass(node.congestionLevel);
                const isCurrent = currentSelected?.id === node.id;
                return (
                  <tr
                    key={node.id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-semibold text-slate-900 dark:text-slate-100">
                          {node.name}
                        </span>
                        {node.isEmergencyPrioritized && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 animate-pulse font-sans font-semibold">
                            EVP
                          </span>
                        )}
                      </div>
                      <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                        {node.description}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-sans font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {node.vehicleCount} <span className="font-normal text-slate-400">v</span>
                    </td>
                    <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-300 font-bold">
                      {node.averageSpeedKmH} <span className="font-normal text-slate-400">km/h</span>
                    </td>
                    <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-300 font-bold">
                      {node.queueLengthMeters} <span className="font-normal text-slate-400">m</span>
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-300 font-bold">
                      {node.waitingTimeMinutes} <span className="font-normal text-slate-400">min</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedNodeId(node.id);
                          selectIntersection(node.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isCurrent ? 'Inspecting' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legal & System Simulation Disclaimer */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong className="text-slate-700 dark:text-slate-300">SIMULATED ESTIMATE NOTICE:</strong> Signal optimization algorithms compute theoretical green-split allocations based on queue density and Webster minimum-delay equations. This prototype demonstrates software architecture and telemetry modeling. It does not exert physical control over municipal traffic signal hardware.
        </p>
      </div>
    </div>
  );
}
