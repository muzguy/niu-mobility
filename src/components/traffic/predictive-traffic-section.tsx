'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Gauge,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTheme } from '@/context/theme-context';
import { apiGetTrafficPrediction } from '@/lib/api-client';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import {
  PredictionHorizon,
  TrafficPredictionResult,
  PredictionTrend,
  RecommendationSeverity,
} from '@/types/prediction';

interface PredictiveTrafficSectionProps {
  activeZoneId: string;
  simulationMode: SimulationTrafficMode;
  onSelectMapHorizon?: (horizon: 'CURRENT' | '15MIN' | '30MIN') => void;
  activeMapHorizon?: 'CURRENT' | '15MIN' | '30MIN';
}

export function PredictiveTrafficSection({
  activeZoneId,
  simulationMode,
  onSelectMapHorizon,
  activeMapHorizon,
}: PredictiveTrafficSectionProps) {
  const { isDark } = useTheme();
  const [internalHorizon, setInternalHorizon] = useState<PredictionHorizon>('plus_15m');
  const [predictionData, setPredictionData] = useState<TrafficPredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive effective selected horizon from map horizon or internal user click
  const selectedHorizon = React.useMemo<PredictionHorizon>(() => {
    if (activeMapHorizon === 'CURRENT') return 'now';
    if (activeMapHorizon === '15MIN') return 'plus_15m';
    if (activeMapHorizon === '30MIN') return 'plus_30m';
    return internalHorizon;
  }, [activeMapHorizon, internalHorizon]);


  useEffect(() => {
    let isMounted = true;
    async function fetchPredictions() {
      setLoading(true);
      try {
        const res = await apiGetTrafficPrediction({
          zoneId: activeZoneId,
          scenario: simulationMode,
        });
        if (isMounted && res.success && res.data) {
          setPredictionData(res.data);
        }
      } catch {
        // Fallback or offline graceful handling
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPredictions();
    return () => {
      isMounted = false;
    };
  }, [activeZoneId, simulationMode]);

  const handleHorizonClick = (h: PredictionHorizon) => {
    setInternalHorizon(h);
    if (onSelectMapHorizon) {

      if (h === 'now') onSelectMapHorizon('CURRENT');
      else if (h === 'plus_15m') onSelectMapHorizon('15MIN');
      else if (h === 'plus_30m') onSelectMapHorizon('30MIN');
    }
  };

  if (loading && !predictionData) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-6 shadow-xs backdrop-blur-sm animate-pulse space-y-4">
        <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!predictionData) return null;

  const currentSummary = predictionData.horizons[selectedHorizon];
  const nowSummary = predictionData.horizons.now;

  // Chart data points across the 4 deterministic horizons
  const chartData = [
    {
      horizon: 'NOW',
      minutes: 0,
      loadPct: predictionData.horizons.now.trafficLoadPct,
      speedKmH: predictionData.horizons.now.averageSpeedKmH,
      delayMin: predictionData.horizons.now.averageDelayMinutes,
    },
    {
      horizon: '+5 MIN',
      minutes: 5,
      loadPct: predictionData.horizons.plus_5m.trafficLoadPct,
      speedKmH: predictionData.horizons.plus_5m.averageSpeedKmH,
      delayMin: predictionData.horizons.plus_5m.averageDelayMinutes,
    },
    {
      horizon: '+15 MIN',
      minutes: 15,
      loadPct: predictionData.horizons.plus_15m.trafficLoadPct,
      speedKmH: predictionData.horizons.plus_15m.averageSpeedKmH,
      delayMin: predictionData.horizons.plus_15m.averageDelayMinutes,
    },
    {
      horizon: '+30 MIN',
      minutes: 30,
      loadPct: predictionData.horizons.plus_30m.trafficLoadPct,
      speedKmH: predictionData.horizons.plus_30m.averageSpeedKmH,
      delayMin: predictionData.horizons.plus_30m.averageDelayMinutes,
    },
  ];

  const getTrendIcon = (trend: PredictionTrend) => {
    switch (trend) {
      case 'worsening':
        return <TrendingUp className="w-3.5 h-3.5 text-rose-500" />;
      case 'improving':
        return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
      case 'stable':
      default:
        return <Minus className="w-3.5 h-3.5 text-cyan-500" />;
    }
  };

  const getTrendBadge = (trend: PredictionTrend) => {
    switch (trend) {
      case 'worsening':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold">
            {getTrendIcon(trend)} Worsening Trend
          </span>
        );
      case 'improving':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            {getTrendIcon(trend)} Improving Flow
          </span>
        );
      case 'stable':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-semibold">
            {getTrendIcon(trend)} Stable Conditions
          </span>
        );
    }
  };

  const getSeverityStyle = (severity: RecommendationSeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-300';
      case 'warning':
        return 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300';
      case 'advisory':
        return 'border-cyan-500/40 bg-cyan-500/5 text-cyan-700 dark:text-cyan-300';
      case 'info':
      default:
        return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';
    }
  };

  // Deltas vs NOW
  const delayDelta = currentSummary.averageDelayMinutes - nowSummary.averageDelayMinutes;
  const speedDelta = currentSummary.averageSpeedKmH - nowSummary.averageSpeedKmH;

  const horizonTabs: { id: PredictionHorizon; label: string; desc: string }[] = [
    { id: 'now', label: 'NOW', desc: 'Current state' },
    { id: 'plus_5m', label: '+5 MIN', desc: 'Immediate pulse' },
    { id: 'plus_15m', label: '+15 MIN', desc: 'Tactical forecast' },
    { id: 'plus_30m', label: '+30 MIN', desc: 'Strategic trend' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-5 shadow-xs backdrop-blur-sm space-y-5">
      {/* Header with Title & Simulation Truth Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Brain className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Predictive Traffic Intelligence & Congestion Forecasting
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              NIU MODELLED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deterministic Bureau of Public Roads (BPR) speed-flow forecasting & time-of-day diurnal curve modeling
          </p>
        </div>

        {/* Truth Rules Badge */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>SIMULATED DEMAND • NO PHYSICAL SENSORS CONNECTED</span>
        </div>
      </div>

      {/* Horizon Selector Tabs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>FORECAST HORIZONS</span>
          <span>SELECT PROJECTION TIMEFRAME</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {horizonTabs.map((tab) => {
            const isSelected = selectedHorizon === tab.id;
            const summary = predictionData.horizons[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => handleHorizonClick(tab.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Load: <strong className="font-mono text-slate-700 dark:text-slate-300">{summary.trafficLoadPct}%</strong> • Speed: <strong className="font-mono text-slate-700 dark:text-slate-300">{summary.averageSpeedKmH} km/h</strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Key Forecast Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Congestion Trend */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Congestion Trend</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {currentSummary.trafficLoadPct}%
            </div>
            {getTrendBadge(currentSummary.trend)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Volume vs Baseline:</span>
            <span className="font-mono font-semibold">
              {currentSummary.totalVehicles} vehicles ({((currentSummary.totalVehicles / Math.max(nowSummary.totalVehicles, 1) - 1) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Metric 2: Predicted Delay */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Predicted Delay</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {currentSummary.averageDelayMinutes} <span className="text-xs font-normal text-slate-500">min</span>
            </div>
            {selectedHorizon !== 'now' && (
              <span
                className={`text-[11px] font-mono font-semibold ${
                  delayDelta > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {delayDelta > 0 ? `+${delayDelta.toFixed(1)}m` : `${delayDelta.toFixed(1)}m`} vs NOW
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Mean Directional Queue:</span>
            <span className="font-mono font-semibold">{currentSummary.averageQueueMeters} m</span>
          </div>
        </div>

        {/* Metric 3: Predicted Velocity */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Corridor Speed</span>
            <Gauge className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {currentSummary.averageSpeedKmH} <span className="text-xs font-normal text-slate-500">km/h</span>
            </div>
            {selectedHorizon !== 'now' && (
              <span
                className={`text-[11px] font-mono font-semibold ${
                  speedDelta < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {speedDelta > 0 ? `+${speedDelta.toFixed(1)}` : `${speedDelta.toFixed(1)}`} km/h
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>BPR Speed-Flow State:</span>
            <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">
              {currentSummary.trafficLoadPct >= 80 ? 'Heavy Drag' : 'Smooth Flow'}
            </span>
          </div>
        </div>

        {/* Metric 4: Prediction Confidence */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Confidence Score</span>
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {(currentSummary.confidence * 100).toFixed(1)}%
            </div>
            <span className="text-[10px] font-mono text-slate-500">BOUNDED [0.60–0.95]</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${currentSummary.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trajectory Forecast Chart (Recharts) */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/40 dark:bg-slate-900/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
              30-Minute Predictive Congestion Trajectory
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              NOW ➔ +30M
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-400 text-[10px]">Traffic Load (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-500"></span>
              <span className="text-slate-600 dark:text-slate-400 text-[10px]">Delay (min)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-500"></span>
              <span className="text-slate-600 dark:text-slate-400 text-[10px]">Speed (km/h)</span>
            </div>
          </div>
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} opacity={0.7} />
              <XAxis
                dataKey="horizon"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#1e293b' : '#e2e8f0' }}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#1e293b' : '#e2e8f0' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f1523' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                }}
              />
              <Line
                type="monotone"
                dataKey="loadPct"
                name="Traffic Load (%)"
                stroke="#10b981"
                strokeWidth={2.2}
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="delayMin"
                name="Delay (min)"
                stroke="#f43f5e"
                strokeWidth={2.2}
                dot={{ r: 4, fill: '#f43f5e' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="speedKmH"
                name="Speed (km/h)"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 3.5, fill: '#06b6d4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NIU Actionable Recommendations Engine Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>NIU Autonomous Mobility Recommendations</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                METRIC-DERIVED
              </span>
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Synthesized dynamically from BPR volume-to-capacity metrics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {predictionData.recommendations.map((rec) => {
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border transition-all ${getSeverityStyle(rec.severity)}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {rec.severity === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    ) : rec.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Info className="w-4 h-4 text-emerald-500" />
                    )}
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {rec.title}
                    </h4>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold bg-white/70 dark:bg-black/30 border border-current">
                    {rec.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 mb-2.5 leading-relaxed">
                  {rec.message}
                </p>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1">
                  <div className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    Recommended Action:
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 text-xs font-medium">
                    {rec.action}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Target: {rec.targetEntity}</span>
                  <span>V/C: {rec.metricBasis.volumeCapacityRatio.toFixed(2)} • Delay: {rec.metricBasis.predictedDelayMinutes}m</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
