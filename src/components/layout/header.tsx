'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSimulation } from '@/context/simulation-context';
import { Flame, ShieldAlert } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const NAV_ITEMS = [
  { href: '/', label: 'Overview' },
  { href: '/traffic', label: 'Traffic Intelligence' },
  { href: '/carpool', label: 'Carpool Network' },
  { href: '/routes', label: 'Smart Routes' },
  { href: '/impact', label: 'Sustainability Impact' },
];

export function Header() {
  const pathname = usePathname();
  const { isRushHour, emergencyCorridor, toggleRushHour, triggerEmergency } = useSimulation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md transition-colors duration-150">
      {/* Emergency Active Alert Bar */}
      {emergencyCorridor.active && (
        <div className="bg-rose-100 dark:bg-rose-950/80 border-b border-rose-300 dark:border-rose-500/40 px-4 py-1.5 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-semibold tracking-wide uppercase">Emergency Priority Active:</span>
            <span className="truncate">Ambulance #AMB-108 en route to Knowledge Park Medical Hub (Green-Wave Enabled)</span>
          </div>
          <button
            onClick={triggerEmergency}
            className="text-xs font-medium text-rose-700 dark:text-rose-300 hover:underline px-2 py-0.5 shrink-0"
          >
            End Simulation Run
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* NIU Network Icon */}
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:border-emerald-500/60 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="2.5" />
                <circle cx="18" cy="6" r="2.5" />
                <circle cx="12" cy="18" r="2.5" />
                <line x1="8.2" y1="7.2" x2="15.8" y2="7.2" />
                <line x1="7.5" y1="8" x2="10.8" y2="15.8" />
                <line x1="16.5" y1="8" x2="13.2" y2="15.8" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wider text-slate-900 dark:text-slate-100 font-mono">NIU</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">v1.0</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">Network for Intelligent Urban Mobility</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-xs lg:text-sm transition-colors ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Simulation Controls, Theme Toggle & Status Badge */}
        <div className="flex items-center gap-2">
          {/* Rush Hour Toggle */}
          <button
            onClick={toggleRushHour}
            title={isRushHour ? "Deactivate Rush Hour Mode" : "Activate Rush Hour Mode (+35% Congestion)"}
            className={`hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors ${
              isRushHour
                ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-medium'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Rush Hour: {isRushHour ? 'ON' : 'OFF'}</span>
          </button>

          {/* Emergency Priority Trigger */}
          <button
            onClick={triggerEmergency}
            title="Simulate Priority Corridor Pre-emption for Emergency Vehicle"
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors ${
              emergencyCorridor.active
                ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500 text-rose-700 dark:text-rose-300 animate-pulse font-medium'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Emergency Mode</span>
          </button>

          {/* Prominent Simulation Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="tracking-wider">SIMULATION</span>
          </div>

          {/* Small Sun/Moon theme icon button */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
