'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { useTheme } from '@/context/theme-context';
import { useSimulation } from '@/context/simulation-context';

export function EmissionsChart() {
  const { theme } = useTheme();
  const { simulationMode } = useSimulation();
  const isDark = theme === 'dark';

  const factor = simulationMode === 'rush_hour' ? 1.25 : simulationMode === 'optimized' ? 1.40 : simulationMode === 'emergency' ? 1.10 : 1.0;

  const weeklyData = [
    { day: 'Mon', carpoolKg: Math.round(380 * factor), signalOptKg: Math.round(240 * factor), ecoRouteKg: Math.round(190 * factor), totalSavedKg: Math.round(810 * factor) },
    { day: 'Tue', carpoolKg: Math.round(420 * factor), signalOptKg: Math.round(260 * factor), ecoRouteKg: Math.round(210 * factor), totalSavedKg: Math.round(890 * factor) },
    { day: 'Wed', carpoolKg: Math.round(460 * factor), signalOptKg: Math.round(290 * factor), ecoRouteKg: Math.round(230 * factor), totalSavedKg: Math.round(980 * factor) },
    { day: 'Thu', carpoolKg: Math.round(490 * factor), signalOptKg: Math.round(310 * factor), ecoRouteKg: Math.round(250 * factor), totalSavedKg: Math.round(1050 * factor) },
    { day: 'Fri', carpoolKg: Math.round(540 * factor), signalOptKg: Math.round(340 * factor), ecoRouteKg: Math.round(290 * factor), totalSavedKg: Math.round(1170 * factor) },
    { day: 'Sat', carpoolKg: Math.round(310 * factor), signalOptKg: Math.round(180 * factor), ecoRouteKg: Math.round(150 * factor), totalSavedKg: Math.round(640 * factor) },
    { day: 'Sun', carpoolKg: Math.round(280 * factor), signalOptKg: Math.round(160 * factor), ecoRouteKg: Math.round(130 * factor), totalSavedKg: Math.round(570 * factor) },
  ];

  return (
    <div className="w-full h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-xs">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-200">Daily Avoided CO2 Emissions (kg)</h3>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
            Contribution breakdown across Carpool Network, Signal Optimization, and Eco-Routing
          </p>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold self-start sm:self-auto">
          7-DAY CUMULATIVE MODEL
        </span>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} opacity={0.8} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: isDark ? '#1e293b' : '#cbd5e1' }} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: isDark ? '#1e293b' : '#cbd5e1' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0f1523' : '#ffffff',
                borderColor: isDark ? '#334155' : '#cbd5e1',
                borderRadius: '8px',
                fontSize: '11px',
                color: isDark ? '#f1f5f9' : '#0f172a',
                boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar dataKey="carpoolKg" name="Carpool Sharing" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="signalOptKg" name="Signal Optimization" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
            <Bar dataKey="ecoRouteKg" name="Eco-Routing" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
