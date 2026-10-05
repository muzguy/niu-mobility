'use client';

import React from 'react';
import { RideMatchResult } from '@/types/carpool';
import { RideCard } from './ride-card';
import { Users, Leaf } from 'lucide-react';

interface MatchResultProps {
  matches: RideMatchResult[];
  onBookRide?: (rideId: string) => void;
}

export function MatchResult({ matches, onBookRide }: MatchResultProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0f1523]/80 p-8 text-center text-slate-400 space-y-3">
        <Users className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
        <h3 className="text-sm font-semibold text-slate-200">No Direct Corridor Matches Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Try expanding your departure window or selecting an adjacent sector (e.g., Pari Chowk interchange).
        </p>
      </div>
    );
  }

  const totalCo2Savings = Number(
    matches.reduce((sum, m) => sum + m.co2SavingKg, 0).toFixed(1)
  );

  return (
    <div className="space-y-4">
      {/* Search Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-800 bg-[#0f1523]/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            {matches.length} Compatible Shared Trips Available
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            DETERMINISTIC RANKING
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs">
          <Leaf className="w-3.5 h-3.5" />
          <span>Potential Pool Dividend: ~{totalCo2Savings} kg CO2</span>
        </div>
      </div>

      {/* Ride Matches List */}
      <div className="space-y-3">
        {matches.map((match) => (
          <RideCard key={match.ride.id} matchResult={match} onBookRide={onBookRide} />
        ))}
      </div>
    </div>
  );
}
