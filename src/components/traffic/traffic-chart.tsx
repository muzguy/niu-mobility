'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HOURLY_TRAFFIC_DATA } from '@/data/traffic';

interface TrafficChartProps {
  height?: number;
}

export function TrafficChart({ height = 280 }: TrafficChartProps) {
  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">Traffic Load (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">Avg Speed (km/h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">Delay (min)</span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-500">24-HOUR HOURLY SIMULATION</span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={HOURLY_TRAFFIC_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f1523',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f1f5f9',
              }}
            />
            <Area
              type="monotone"
              dataKey="loadPct"
              name="Traffic Load %"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLoad)"
            />
            <Area
              type="monotone"
              dataKey="avgSpeedKmH"
              name="Avg Speed (km/h)"
              stroke="#06b6d4"
              strokeWidth={1.8}
              fillOpacity={1}
              fill="url(#colorSpeed)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
