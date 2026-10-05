'use client';

import React from 'react';
import { RouteOption } from '@/types/routing';
import { Clock, Leaf, Droplet, CheckCircle2 } from 'lucide-react';

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function RouteCard({ route, isSelected, onSelect }: RouteCardProps) {
  const getTrafficBadge = (level: 'Low' | 'Medium' | 'High') => {
    switch (level) {
      case 'Low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'High':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  const getTypeHeaderStyles = (type: string) => {
    switch (type) {
      case 'fastest':
        return {
          badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          borderActive: 'border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        };
      case 'balanced':
        return {
          badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          borderActive: 'border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        };
      case 'greenest':
        return {
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          borderActive: 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        };
      default:
        return {
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          borderActive: 'border-slate-600',
        };
    }
  };

  const styles = getTypeHeaderStyles(route.type);

  return (
    <div
      onClick={() => onSelect(route.id)}
      className={`rounded-xl border p-5 bg-[#0f1523]/80 backdrop-blur-sm transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
        isSelected
          ? `${styles.borderActive} bg-[#141c2e]`
          : 'border-slate-800 hover:border-slate-700 hover:bg-[#121929]'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${styles.badge}`}>
              {route.title}
            </span>
            {route.isRecommended && (
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                RECOMMENDED
              </span>
            )}
          </div>

          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getTrafficBadge(route.trafficLevel)}`}>
            {route.trafficLevel} Traffic
          </span>
        </div>

        {/* ETA & Distance */}
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-slate-100 flex items-baseline gap-1">
              <span>{route.etaMinutes}</span>
              <span className="text-sm font-normal text-slate-400">min</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{route.tagline}</p>
          </div>

          <div className="text-right">
            <div className="font-mono text-sm font-semibold text-slate-300">
              {route.distanceKm} km
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ~{route.averageSpeedKmH} km/h avg
            </div>
          </div>
        </div>

        {/* Corridor Description */}
        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          {route.pathDescription}
        </p>

        {/* Key Corridors Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {route.keyCorridors.map((c, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
          <div className="p-2 rounded border border-slate-800 bg-slate-950/50">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Leaf className="w-3 h-3 text-emerald-400" />
              <span>CO2 Emitted</span>
            </div>
            <div className="font-mono font-bold text-slate-200 mt-0.5">
              {route.estimatedCo2Kg} kg
            </div>
          </div>

          <div className="p-2 rounded border border-slate-800 bg-slate-950/50">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Droplet className="w-3 h-3 text-cyan-400" />
              <span>Fuel Burn</span>
            </div>
            <div className="font-mono font-bold text-slate-200 mt-0.5">
              {route.fuelConsumedLiters} L
            </div>
          </div>

          <div className="p-2 rounded border border-slate-800 bg-slate-950/50">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Idle Delay</span>
            </div>
            <div className="font-mono font-bold text-slate-200 mt-0.5">
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
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            isSelected
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
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
