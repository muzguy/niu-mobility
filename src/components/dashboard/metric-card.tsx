import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  badge?: string;
  description?: string;
  accentColor?: 'green' | 'amber' | 'rose' | 'cyan';
}

export function MetricCard({
  label,
  value,
  unit,
  change,
  changeType = 'neutral',
  icon: Icon,
  badge = 'SIMULATED',
  description,
  accentColor = 'green',
}: MetricCardProps) {
  const getAccentStyles = () => {
    switch (accentColor) {
      case 'green':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          border: 'border-slate-800 hover:border-emerald-500/40',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          border: 'border-slate-800 hover:border-amber-500/40',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          border: 'border-slate-800 hover:border-rose-500/40',
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          border: 'border-slate-800 hover:border-cyan-500/40',
        };
    }
  };

  const accent = getAccentStyles();

  return (
    <div
      className={`relative p-4 rounded-xl border bg-[#0f1523]/80 backdrop-blur-sm transition-all duration-200 ${accent.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
          {label}
        </span>
        <div className={`p-2 rounded-lg border ${accent.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-100">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        {change ? (
          <span
            className={`font-medium ${
              changeType === 'positive'
                ? 'text-emerald-400'
                : changeType === 'negative'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {change}
          </span>
        ) : description ? (
          <span className="text-slate-400 truncate">{description}</span>
        ) : (
          <span className="text-slate-500 text-[11px]">Monitored Network Area</span>
        )}

        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
