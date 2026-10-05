'use client';

import React, { useState } from 'react';
import { RideMatchResult } from '@/types/carpool';
import {
  Car,
  Clock,
  Leaf,
  Users,
  Star,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RideCardProps {
  matchResult: RideMatchResult;
  onBookRide?: (rideId: string) => void;
}

export function RideCard({ matchResult, onBookRide }: RideCardProps) {
  const { ride, matchScore, scoreBreakdown, co2SavingKg } = matchResult;
  const [isBooked, setIsBooked] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  const handleBook = () => {
    setIsBooked(true);
    if (onBookRide) {
      onBookRide(ride.id);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  const getFuelBadge = (fuel: string) => {
    switch (fuel) {
      case 'ev':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/30';
      case 'hybrid':
        return 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-500/30';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-5 shadow-xs backdrop-blur-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {/* Top Driver Info & Match Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
            {ride.driverName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{ride.driverName}</span>
              {ride.verifiedDriver && (
                <span title="Verified Commuter">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-mono">{ride.driverRating}</span>
              </div>
              <span>•</span>
              <span>{ride.driverTripsCount} shared trips</span>
            </div>
          </div>
        </div>

        {/* Match Compatibility Badge */}
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded border ${getScoreBadge(
              matchScore
            )}`}
          >
            {matchScore}% MATCH
          </span>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">Deterministic Score</div>
        </div>
      </div>

      {/* Corridor & Departure Schedule */}
      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
            <span className="text-emerald-600 dark:text-emerald-400">{ride.origin}</span>
            <span className="text-slate-400 dark:text-slate-500 font-mono">➔</span>
            <span className="text-cyan-600 dark:text-cyan-400">{ride.destination}</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{ride.departureTime}</span>
          </div>
        </div>

        {/* Waypoints snippet */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          <span className="text-slate-400">Via: </span>
          {ride.waypoints.join(' · ')}
        </div>
      </div>

      {/* Metrics Row: Seats, Overlap, CO2 savings */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
        <div className="p-2 rounded border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span>Seats</span>
          </div>
          <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {ride.availableSeats} of {ride.totalSeats} left
          </div>
        </div>

        <div className="p-2 rounded border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Route Overlap</div>
          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {ride.routeOverlapPct}%
          </div>
        </div>

        <div className="p-2 rounded border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <Leaf className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>CO2 Saving</span>
          </div>
          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-300 mt-0.5">
            {co2SavingKg} kg
          </div>
        </div>
      </div>

      {/* Vehicle Info & Booking CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-2 text-xs">
          <Car className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">{ride.vehicleModel}</span>
          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${getFuelBadge(ride.fuelType)}`}>
            {ride.fuelType}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Match Score Breakdown Toggle */}
          <button
            onClick={() => setShowBreakdown((v) => !v)}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-0.5 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Algorithm Weights</span>
            {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Booking CTA Button */}
          {isBooked ? (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-xs font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Simulated Seat Confirmed</span>
            </div>
          ) : (
            <button
              onClick={handleBook}
              disabled={ride.availableSeats === 0}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              {ride.availableSeats > 0 ? 'Request Shared Seat' : 'Trip Full'}
            </button>
          )}
        </div>
      </div>

      {/* Deterministic Breakdown Drawer */}
      {showBreakdown && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg">
          <div className="flex justify-between">
            <span>Spatial Route Overlap (45%):</span>
            <span className="text-slate-800 dark:text-slate-200">{scoreBreakdown.routeOverlapPct}%</span>
          </div>
          <div className="flex justify-between">
            <span>Departure Window Affinity (30%):</span>
            <span className="text-slate-800 dark:text-slate-200">{scoreBreakdown.timeSimilarityPct}%</span>
          </div>
          <div className="flex justify-between">
            <span>Destination Alignment (15%):</span>
            <span className="text-slate-800 dark:text-slate-200">{scoreBreakdown.destinationSimilarityPct}%</span>
          </div>
          <div className="flex justify-between">
            <span>Detour Cost Penalty (-10%):</span>
            <span className="text-amber-600 dark:text-amber-400">-{scoreBreakdown.detourPenaltyPct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
