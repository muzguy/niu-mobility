'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSimulation } from '@/context/simulation-context';
import {
  LayoutDashboard,
  Radio,
  Users,
  Route,
  Leaf,
  Siren,
} from 'lucide-react';
import { getCongestionBadgeClass } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { intersections, selectIntersection, selectedIntersection, emergencyCorridor, triggerEmergency } =
    useSimulation();

  const links = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/traffic', label: 'Traffic Intelligence', icon: Radio },
    { href: '/carpool', label: 'Carpool Network', icon: Users },
    { href: '/routes', label: 'Smart Routes', icon: Route },
    { href: '/impact', label: 'Sustainability Impact', icon: Leaf },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto transition-colors duration-150">
      {/* Primary Links */}
      <div className="p-4 space-y-1">
        <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">
          Platform Modules
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Intersections Quick Inspector */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/60 flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            Monitored Intersections
          </p>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-semibold">
            5 NODES
          </span>
        </div>

        <div className="space-y-1.5">
          {intersections.map((node) => {
            const isSelected = selectedIntersection?.id === node.id;
            const badge = getCongestionBadgeClass(node.congestionLevel);
            return (
              <button
                key={node.id}
                onClick={() => selectIntersection(node.id)}
                className={`w-full text-left p-2 rounded-md border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate text-slate-800 dark:text-slate-200">{node.shortName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                    {node.congestionLevel}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{node.vehicleCount} veh</span>
                  <span>{node.averageSpeedKmH} km/h</span>
                  <span>{node.waitingTimeMinutes}m wait</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emergency Simulation Banner in Sidebar */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/60">
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-300">
            <Siren className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Emergency Priority (EVP)</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Simulate rapid green-corridor wave along Alpha 1 ➔ Pari Chowk ➔ Knowledge Park.
          </p>
          <button
            onClick={triggerEmergency}
            className={`w-full py-1.5 px-3 text-xs font-medium rounded border transition-colors cursor-pointer ${
              emergencyCorridor.active
                ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700 shadow-xs'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
            }`}
          >
            {emergencyCorridor.active ? 'Cancel Emergency Run' : 'Simulate Emergency Vehicle'}
          </button>
        </div>
      </div>
    </aside>
  );
}
