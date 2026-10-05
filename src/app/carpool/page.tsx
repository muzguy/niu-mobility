'use client';

import React, { useState } from 'react';
import { RideSearch } from '@/components/carpool/ride-search';
import { MatchResult } from '@/components/carpool/match-result';
import { carpoolEngine } from '@/lib/carpool/carpool-engine';
import { RideMatchResult, RideSearchQuery } from '@/types/carpool';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Users, Leaf, Car, Info } from 'lucide-react';

export default function CarpoolPage() {
  const [matches, setMatches] = useState<RideMatchResult[]>(() =>
    carpoolEngine.searchRides({
      origin: 'Alpha 1',
      destination: 'Knowledge Park',
      departureTime: '08:25 AM',
      seats: 1,
    })
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSearch = (query: RideSearchQuery) => {
    setIsLoading(true);
    setTimeout(() => {
      const results = carpoolEngine.searchRides(query);
      setMatches(results);
      setIsLoading(false);
    }, 200);
  };

  const handleBookRide = (rideId: string) => {
    carpoolEngine.bookSeat(rideId, 1);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Carpool Matching Network
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              DETERMINISTIC MATCHER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pairing Greater Noida commuters along shared corridors to eliminate redundant solo private vehicle trips
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          Active Carpoolers: <span className="text-emerald-400 font-bold">142 Drivers</span>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Active Shared Trips"
          value="87"
          unit="rides"
          change="Pooled journeys"
          changeType="positive"
          icon={Users}
          accentColor="cyan"
          description="In transit across Greater Noida"
        />

        <MetricCard
          label="Daily CO2 Mitigated"
          value="524"
          unit="kg"
          change="Direct vehicle reduction"
          changeType="positive"
          icon={Leaf}
          accentColor="green"
          description="By pairing overlapping routes"
        />

        <MetricCard
          label="Average Route Overlap"
          value="88"
          unit="%"
          change="High corridor affinity"
          changeType="positive"
          icon={Car}
          accentColor="amber"
          description="Mean corridor overlap ratio"
        />
      </div>

      {/* Ride Search Form */}
      <div>
        <RideSearch onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* Matches Results List */}
      <div>
        <MatchResult matches={matches} onBookRide={handleBookRide} />
      </div>

      {/* Algorithmic Integrity Note */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>DETERMINISTIC ALGORITHM NOTICE:</strong> Compatibility matching uses weighted Euclidean proximity, departure window decay, and waypoint intersection analysis. It avoids opaque generative AI hallucinations. In Phase 9, Supabase PostGIS spatial indices will power sub-millisecond route matching.
        </p>
      </div>
    </div>
  );
}
