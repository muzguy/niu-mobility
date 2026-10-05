'use client';

import React from 'react';
import { RouteOption } from '@/types/routing';
import { Clock, Leaf, Droplet, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function RouteCard({ route, isSelected, onSelect }: RouteCardProps) {
  const getTrafficBadge = (level: 'Low' | 'Medium' | 'High') => {
    switch (level) {
      case 'Low':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30';
      case 'Medium':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30';
      case 'High':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30';
    }
  };

  const getTypeHeaderStyles = (type: string) => {
    switch (type) {
      case 'fastest':
        return {
          badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30',
          borderActive: 'border-rose-400 dark:border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-rose-50/20 dark:bg-[#141c2e]',
        };
      case 'balanced':
        return {
          badge: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30',
          borderActive: 'border-cyan-400 dark:border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-cyan-50/20 dark:bg-[#141c2e]',
        };
      case 'greenest':
        return {
          badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
          borderActive: 'border-emerald-400 dark:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-50/20 dark:bg-[#141c2e]',
        };
      default:
        return {
          badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
          borderActive: 'border-emerald-400 dark:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-50/20 dark:bg-[#141c2e]',
        };
    }
  };

  const styles = getTypeHeaderStyles(route.type);
  const niuScore = route.niuScore ?? 85;

  return (
    <div
      onClick={() => onSelect(route.id)}
      className={`rounded-xl border p-5 shadow-xs backdrop-blur-sm transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
        isSelected
          ? `${styles.borderActive}`
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-[#121929]'
      }`}
    >
      <div>
        {/* Top Badges & NIU Score */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${styles.badge}`}>
              {route.title}
            </span>
            {route.isRecommended && (
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                NIU OPTIMAL
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getTrafficBadge(route.trafficLevel)}`}>
              {route.trafficLevel} Flow
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{niuScore}/100</span>
            </div>
          </div>
        </div>

        {/* ETA & Distance */}
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
              <span>{route.etaMinutes}</span>
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">min</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{route.tagline}</p>
          </div>

          <div className="text-right">
            <div className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-300">
              {route.distanceKm} km
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-500 font-mono">
              ~{route.averageSpeedKmH} km/h avg
            </div>
          </div>
        </div>

        {/* Deterministic Explanation & Rationale */}
        {route.recommendationReason && (
          <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            <strong className="text-slate-900 dark:text-slate-200">Analysis: </strong>
            {route.recommendationReason}
          </div>
        )}

        {/* Corridor Description */}
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {route.pathDescription}
        </p>

        {/* Key Corridors Tags */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {route.keyCorridors.map((c, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
          <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
              <Leaf className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>EST. CO2</span>
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {route.estimatedCo2Kg} kg
            </div>
          </div>

          <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
              <Droplet className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              <span>Fuel Burn</span>
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {route.fuelConsumedLiters} L
            </div>
          </div>

          <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Signal Delay</span>
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {route.idleDelayMinutes} min
            </div>
          </div>
        </div>

        {/* Selection Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(route.id);
          }}
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isSelected
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Active Selected Route</span>
            </>
          ) : (
            <span>Select This Route</span>
          )}
        </button>
      </div>
    </div>
  );
}
