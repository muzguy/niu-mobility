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
          iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
          border: 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/40',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
          border: 'border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
          border: 'border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/40',
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
          border: 'border-slate-200/90 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/40',
        };
    }
  };

  const accent = getAccentStyles();

  return (
    <div
      className={`relative p-4 rounded-xl border bg-white/90 dark:bg-[#0f1523]/80 backdrop-blur-sm shadow-xs dark:shadow-none transition-all duration-200 ${accent.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
          {label}
        </span>
        <div className={`p-2 rounded-lg border ${accent.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        {change ? (
          <span
            className={`font-semibold ${
              changeType === 'positive'
                ? 'text-emerald-700 dark:text-emerald-400'
                : changeType === 'negative'
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {change}
          </span>
        ) : description ? (
          <span className="text-slate-600 dark:text-slate-400 truncate">{description}</span>
        ) : (
          <span className="text-slate-500 dark:text-slate-500 text-[11px]">Monitored Network Area</span>
        )}

        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
