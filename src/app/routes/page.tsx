'use client';

import React from 'react';
import { RouteComparison } from '@/components/routes/route-comparison';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Leaf, Clock, Gauge } from 'lucide-react';

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Smart Route Comparison & Eco-Navigation
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SIMULATED PROVIDER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Compare Fastest, Balanced, and Greenest corridor alternatives with IPCC-calibrated carbon footprint modeling
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          Route Profiles: <span className="text-emerald-400 font-bold">Fastest · Balanced · Greenest</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Fastest Profile"
          value="28"
          unit="min"
          change="High Arterial Congestion"
          changeType="negative"
          icon={Clock}
          accentColor="rose"
          description="Direct radial spine"
        />

        <MetricCard
          label="Balanced Profile"
          value="30"
          unit="min"
          change="Medium Flow / Optimal"
          changeType="neutral"
          icon={Gauge}
          accentColor="cyan"
          description="Bypasses Pari Chowk bottleneck"
        />

        <MetricCard
          label="Greenest Profile"
          value="32"
          unit="min"
          change="-43% Lower Emissions"
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
