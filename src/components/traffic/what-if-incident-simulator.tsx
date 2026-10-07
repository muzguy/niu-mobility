'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Play,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ShieldAlert,
  Clock,
  Layers,
  Activity,
  Info,
} from 'lucide-react';
import {
  IncidentType,
  IncidentSeverity,
  IncidentDurationMinutes,
  SimulatedIncident,
  IncidentSimulationResult,
} from '@/types/incident';
import { Intersection } from '@/types/traffic';
import { apiSimulateIncident } from '@/lib/api-client';
import { SEEDED_MOBILITY_ZONES } from '@/data/mobility-zones-seed';
import { simulateMobilityIncident } from '@/lib/traffic/incident-simulator';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';

interface WhatIfIncidentSimulatorProps {
  activeZoneId: string;
  intersections: Intersection[];
  simulationMode?: SimulationTrafficMode;
  onIncidentChange?: (incident: SimulatedIncident | null) => void;
}

const INCIDENT_TYPES: { id: IncidentType; label: string; icon: string; desc: string }[] = [
  { id: 'accident', label: 'Accident', icon: '💥', desc: 'Vehicular collision restricting arterial flow' },
  { id: 'road_work', label: 'Road Work', icon: '🚧', desc: 'Civil maintenance / lane narrowing' },
  { id: 'lane_blockage', label: 'Lane Blockage', icon: '⛔', desc: 'Stalled vehicle / obstacle in lane' },
  { id: 'emergency', label: 'Emergency', icon: '🚨', desc: 'Active corridor hazard & diversion' },
];

const SEVERITY_LEVELS: { id: IncidentSeverity; label: string; color: string }[] = [
  { id: 'minor', label: 'Minor', color: 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600/50 bg-amber-500/10' },
  { id: 'moderate', label: 'Moderate', color: 'text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600/50 bg-orange-500/10' },
  { id: 'major', label: 'Major', color: 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-600/50 bg-rose-500/10' },
];

const DURATION_OPTIONS: { id: IncidentDurationMinutes; label: string }[] = [
  { id: 10, label: '10 min' },
  { id: 20, label: '20 min' },
  { id: 30, label: '30 min' },
];

export function WhatIfIncidentSimulator({
  activeZoneId,
  intersections,
  simulationMode = 'normal',
  onIncidentChange,
}: WhatIfIncidentSimulatorProps) {
  const [selectedType, setSelectedType] = useState<IncidentType>('accident');
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string>(
    intersections[0]?.id || 'pari-chowk'
  );
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>('moderate');
  const [selectedDuration, setSelectedDuration] = useState<IncidentDurationMinutes>(20);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<IncidentSimulationResult | null>(null);

  const effectiveIntersectionId =
    intersections.find((i) => i.id === selectedIntersectionId)?.id ||
    intersections[0]?.id ||
    'pari-chowk';

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await apiSimulateIncident({
        zoneId: activeZoneId,
        type: selectedType,
        intersectionId: effectiveIntersectionId,
        severity: selectedSeverity,
        durationMinutes: selectedDuration,
        scenario: simulationMode,
      });

      if (res.success && res.data) {
        setSimulationResult(res.data);
        if (onIncidentChange) {
          onIncidentChange(res.data.incident);
        }
      } else {
        // Fallback to deterministic client-side calculation
        const seed = SEEDED_MOBILITY_ZONES.find((z) => z.id === activeZoneId) || SEEDED_MOBILITY_ZONES[0];
        const localResult = simulateMobilityIncident(seed, {
          type: selectedType,
          intersectionId: effectiveIntersectionId,
          severity: selectedSeverity,
          durationMinutes: selectedDuration,
          scenario: simulationMode,
        });
        setSimulationResult(localResult);
        if (onIncidentChange) {
          onIncidentChange(localResult.incident);
        }
      }
    } catch {
      // Deterministic fallback
      const seed = SEEDED_MOBILITY_ZONES.find((z) => z.id === activeZoneId) || SEEDED_MOBILITY_ZONES[0];
      const localResult = simulateMobilityIncident(seed, {
        type: selectedType,
        intersectionId: effectiveIntersectionId,
        severity: selectedSeverity,
        durationMinutes: selectedDuration,
        scenario: simulationMode,
      });
      setSimulationResult(localResult);
      if (onIncidentChange) {
        onIncidentChange(localResult.incident);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setSimulationResult(null);
    if (onIncidentChange) {
      onIncidentChange(null);
    }
  };

  const renderTrendIcon = (trend: 'improving' | 'stable' | 'worsening') => {
    switch (trend) {
      case 'improving':
        return (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
            <TrendingDown className="w-3.5 h-3.5" /> Improving
          </span>
        );
      case 'worsening':
        return (
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-xs">
            <TrendingUp className="w-3.5 h-3.5" /> Worsening
          </span>
        );
      case 'stable':
      default:
        return (
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold text-xs">
            <Minus className="w-3.5 h-3.5" /> Stable
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-5 shadow-xs backdrop-blur-sm space-y-5">
      {/* Header and Truth Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-sans">
                WHAT IF? — Mobility Incident Simulator
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-semibold">
                SCENARIO OVERLAY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate traffic incidents on active network nodes to evaluate corridor resilience and queuing impacts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {simulationResult && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset Baseline
            </button>
          )}
        </div>
      </div>

      {/* Control Form: Type, Location, Severity, Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Incident Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            Incident Type
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {INCIDENT_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500/60 text-rose-800 dark:text-rose-200 font-semibold shadow-2xs'
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{type.icon}</span>
                    <span className="text-xs truncate">{type.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Target Intersection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            Location / Junction
          </label>
          <select
            value={selectedIntersectionId}
            onChange={(e) => setSelectedIntersectionId(e.target.value)}
            className="w-full h-[78px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 text-xs font-sans focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            {intersections.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name} ({node.vehicleCount}v / {node.averageSpeedKmH} km/h)
              </option>
            ))}
          </select>
        </div>

        {/* 3. Severity Level */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            Severity Level
          </label>
          <div className="grid grid-cols-3 gap-1.5 h-[78px]">
            {SEVERITY_LEVELS.map((sev) => {
              const isSelected = selectedSeverity === sev.id;
              return (
                <button
                  key={sev.id}
                  onClick={() => setSelectedSeverity(sev.id)}
                  className={`flex flex-col items-center justify-center rounded-lg border transition-all cursor-pointer p-1.5 ${
                    isSelected
                      ? `${sev.color} font-bold shadow-2xs border-current`
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs">{sev.label}</span>
                  <span className="text-[9px] font-mono mt-0.5 opacity-75">
                    {sev.id === 'major' ? '-75% cap' : sev.id === 'moderate' ? '-50% cap' : '-30% cap'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Duration & Simulation Action */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {DURATION_OPTIONS.map((dur) => {
                const isSelected = selectedDuration === dur.id;
                return (
                  <button
                    key={dur.id}
                    onClick={() => setSelectedDuration(dur.id)}
                    className={`py-1.5 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500/60 text-rose-700 dark:text-rose-300 font-bold'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {dur.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full mt-2 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Modeling Dynamics...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>SIMULATE SCENARIO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE SCENARIO RESULTS PANEL */}
      {simulationResult && (
        <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          {/* Truth Disclaimer Banner */}
          <div className="px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                ACTIVE SCENARIO: {simulationResult.incident.severity.toUpperCase()} {simulationResult.incident.type.replace('_', ' ').toUpperCase()} at {simulationResult.incident.intersectionName}
              </span>
            </div>
            <div className="font-mono text-[10px] text-rose-700/80 dark:text-rose-400/80">
              USER-SIMULATED SCENARIO • NOT PHYSICAL DETECTION
            </div>
          </div>

          {/* COMPARE IMPACT TABLE: WITHOUT INCIDENT | WITH INCIDENT */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                COMPARE IMPACT — BEFORE vs AFTER
              </h3>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Deterministic Model Metrics
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0f1523]">
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3 text-right">WITHOUT INCIDENT</th>
                    <th className="py-2.5 px-3 text-right">WITH INCIDENT</th>
                    <th className="py-2.5 px-3 text-right">Delta (Δ)</th>
                    <th className="py-2.5 px-3 text-center">Impact Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono bg-white dark:bg-[#0f1523]/50">
                  {simulationResult.comparison.map((item) => {
                    const isWorse = item.status === 'worsened';
                    const isImproved = item.status === 'improved';
                    return (
                      <tr key={item.metric} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {item.metric}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-semibold">
                          {item.before} <span className="text-[10px] text-slate-400">{item.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                          {item.after} <span className="text-[10px] text-slate-400">{item.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span
                            className={
                              isWorse
                                ? 'text-rose-600 dark:text-rose-400'
                                : isImproved
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400'
                            }
                          >
                            {item.delta > 0 ? `+${item.delta}` : item.delta} {item.unit} ({item.deltaPercent > 0 ? `+${item.deltaPercent}` : item.deltaPercent}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-sans px-2 py-0.5 rounded border uppercase font-medium ${
                              isWorse
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                : isImproved
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Predicted Trend Row */}
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                      Predicted Trend
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <div className="flex justify-end">
                        {renderTrendIcon(simulationResult.withoutIncident.trend)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <div className="flex justify-end">
                        {renderTrendIcon(simulationResult.withIncident.trend)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-500 font-sans text-[11px]">
                      Degraded
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded border uppercase font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                        Worsened
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TEMPORAL HORIZON PROJECTIONS (NOW / +15 MIN / +30 MIN) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                TEMPORAL HORIZON MODELING (NOW / +15 MIN / +30 MIN)
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Duration: {simulationResult.incident.durationMinutes} min (shows queue accumulation & dissipation)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* NOW Horizon */}
              <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 font-mono">NOW (Incident Peak)</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30">
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs space-y-1 pt-1 font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Delay:</span>
                    <span>
                      <span className="line-through opacity-70">{simulationResult.horizons.now.withoutDelayMin}m</span>{' '}
                      <strong className="text-rose-600 dark:text-rose-400 font-bold">{simulationResult.horizons.now.withDelayMin} min</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Speed:</span>
                    <span>
                      <span className="line-through opacity-70">{simulationResult.horizons.now.withoutSpeedKmH}</span>{' '}
                      <strong className="text-rose-600 dark:text-rose-400 font-bold">{simulationResult.horizons.now.withSpeedKmH} km/h</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Load:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">{simulationResult.horizons.now.withLoadPct}%</strong>
                  </div>
                </div>
              </div>

              {/* +15 MIN Horizon */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">+15 MIN Horizon</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {simulationResult.incident.durationMinutes <= 10 ? 'DISSIPATING' : 'CHOKED'}
                  </span>
                </div>
                <div className="text-xs space-y-1 pt-1 font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Delay:</span>
                    <span>
                      <span className="line-through opacity-70">{simulationResult.horizons.plus_15m.withoutDelayMin}m</span>{' '}
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{simulationResult.horizons.plus_15m.withDelayMin} min</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Speed:</span>
                    <span>
                      <span className="line-through opacity-70">{simulationResult.horizons.plus_15m.withoutSpeedKmH}</span>{' '}
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{simulationResult.horizons.plus_15m.withSpeedKmH} km/h</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Load:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">{simulationResult.horizons.plus_15m.withLoadPct}%</strong>
                  </div>
                </div>
              </div>

              {/* +30 MIN Horizon */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">+30 MIN Horizon</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {simulationResult.incident.durationMinutes < 30 ? 'RECOVERED' : 'RESIDUAL'}
                  </span>
                </div>
                <div className="text-xs space-y-1 pt-1 font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Delay:</span>
                    <span>
                      <span className="line-through opacity-70">{simulationResult.horizons.plus_30m.withoutDelayMin}m</span>{' '}
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{simulationResult.horizons.plus_30m.withDelayMin} min</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Speed:</span>
                    <span>
                      <span className="line-through opacity-70">{simulationResult.horizons.plus_30m.withoutSpeedKmH}</span>{' '}
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{simulationResult.horizons.plus_30m.withSpeedKmH} km/h</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Load:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">{simulationResult.horizons.plus_30m.withLoadPct}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC NIU RECOMMENDATION & AFFECTED CORRIDORS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* NIU Recommendation */}
            <div className="p-3.5 rounded-lg border border-emerald-300 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h4 className="text-xs font-bold font-sans">
                  {simulationResult.recommendation.title}
                </h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {simulationResult.recommendation.message}
              </p>
              <div className="p-2 rounded bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800 text-[11px] font-sans text-emerald-900 dark:text-emerald-200">
                <strong>Prescriptive Action:</strong> {simulationResult.recommendation.action}
              </div>
            </div>

            {/* Affected Corridors */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  Impacted Road Segments & Junctions
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {simulationResult.affectedRoadIds.length} Segments
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                The simulated incident constrains capacity across feeder legs directly adjoining{' '}
                <strong className="text-slate-800 dark:text-slate-200">{simulationResult.incident.intersectionName}</strong>.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {simulationResult.affectedRoadIds.map((roadId) => (
                  <span
                    key={roadId}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                  >
                    {roadId}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Provenance and Truth Statements */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{simulationResult.provenance.truthStatement}</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              {simulationResult.provenance.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
