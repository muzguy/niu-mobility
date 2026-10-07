'use client';

import React from 'react';
import { ImpactCard } from '@/components/impact/impact-card';
import { EmissionsChart } from '@/components/impact/emissions-chart';
import { SustainabilityScore } from '@/components/impact/sustainability-score';
import { Leaf, Droplet, Users, Clock, Trees, Award } from 'lucide-react';
import { useSimulation } from '@/context/simulation-context';

import { apiGetImpact } from '@/lib/api-client';

export default function ImpactPage() {
  const { simulationMode, mobilityState } = useSimulation();
  const [serverMetrics, setServerMetrics] = React.useState<{
    co2SavedTons: number;
    fuelSavedLiters: number;
    tripsAvoided: number;
    commuteHoursSaved: number;
    trees: number;
    charges: number;
    pm25: number;
  } | null>(null);

  React.useEffect(() => {
    async function loadImpact() {
      try {
        const res = await apiGetImpact(simulationMode);
        if (res.success && res.data) {
          setServerMetrics({
            co2SavedTons: res.data.metrics.estimatedCo2SavedTons,
            fuelSavedLiters: res.data.metrics.fuelSavedLiters,
            tripsAvoided: res.data.metrics.tripsAvoided,
            commuteHoursSaved: res.data.metrics.commuteHoursSaved,
            trees: Math.round(res.data.metrics.estimatedCo2SavedTons * 45),
            charges: Math.round(res.data.metrics.estimatedCo2SavedTons * 121950),
            pm25: Number((res.data.metrics.fuelSavedLiters * 0.0048).toFixed(2)),
          });
        }
      } catch {
        // Fallback to simulation context
      }
    }
    loadImpact();
  }, [simulationMode]);

  const co2Val = serverMetrics ? serverMetrics.co2SavedTons : mobilityState.co2SavedTons;
  const fuelVal = serverMetrics ? serverMetrics.fuelSavedLiters : mobilityState.fuelSavedLiters;
  const tripsVal = serverMetrics ? serverMetrics.tripsAvoided : mobilityState.tripsAvoided;
  const hoursVal = serverMetrics ? serverMetrics.commuteHoursSaved : mobilityState.commuteHoursSaved;
  const treesVal = serverMetrics ? serverMetrics.trees : Math.round(mobilityState.co2SavedTons * 45);
  const chargesVal = serverMetrics ? serverMetrics.charges.toLocaleString() : Math.round(mobilityState.co2SavedTons * 121950).toLocaleString();
  const pm25Val = serverMetrics ? serverMetrics.pm25 : Number((mobilityState.fuelSavedLiters * 0.0048).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Sustainability & Carbon Impact Accounting
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              IPCC TIER-1 PROTOCOL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Quantifying greenhouse gas mitigation, avoided vehicular burn & urban sustainability indices
          </p>
        </div>

        <div className="text-xs font-mono text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          Cumulative Progress: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{co2Val} Tons CO2 Averted</span>
        </div>
      </div>

      {/* TOP 4 KEY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ImpactCard
          title="Estimated CO2 Saved"
          value={co2Val}
          unit="Tons"
          subtitle="Avoided exhaust emissions"
          icon={Leaf}
          colorTheme="emerald"
        />

        <ImpactCard
          title="Fuel Saved"
          value={fuelVal}
          unit="Liters"
          subtitle="Combustion fuel conserved"
          icon={Droplet}
          colorTheme="cyan"
        />

        <ImpactCard
          title="Vehicle Trips Avoided"
          value={tripsVal}
          unit="trips"
          subtitle="Single-occupancy cars diverted"
          icon={Users}
          colorTheme="amber"
        />

        <ImpactCard
          title="Commute Time Saved"
          value={hoursVal}
          unit="Hours"
          subtitle="Cumulative urban travel delay cut"
          icon={Clock}
          colorTheme="blue"
        />
      </div>

      {/* Sustainability Score Widget */}
      <div>
        <SustainabilityScore />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Cumulative CO2 Emissions Avoided Chart */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-5 shadow-xs backdrop-blur-sm">
          <EmissionsChart />
        </div>

        {/* Tree & Environmental Equivalency Widget */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-5 shadow-xs backdrop-blur-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <Trees className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Environmental Equivalency</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Carbon offset benchmarks</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Tree Seedlings Grown (10 Yrs)</div>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">{treesVal} Trees</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Equivalent biogenic carbon sequestration</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Smartphone Charges Averted</div>
                <div className="text-xl font-bold font-mono text-cyan-700 dark:text-cyan-300 mt-0.5">{chargesVal}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Grid kilowatt-hour equivalent</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Urban Smog Particulates (PM2.5)</div>
                <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5">-{pm25Val} kg</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Fine particulate matter mitigated</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Target 2026: 25.0 Metric Tons CO2 avoided across Greater Noida</span>
          </div>
        </div>
      </div>
    </div>
  );
}
