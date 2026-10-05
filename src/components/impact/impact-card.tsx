import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ImpactCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  icon: LucideIcon;
  colorTheme?: 'emerald' | 'cyan' | 'amber' | 'blue';
}

export function ImpactCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  colorTheme = 'emerald',
}: ImpactCardProps) {
  const getThemeStyles = () => {
    switch (colorTheme) {
      case 'emerald':
        return {
          icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
          border: 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/40',
        };
      case 'cyan':
        return {
          icon: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30',
          border: 'border-slate-200/90 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/40',
        };
      case 'amber':
        return {
          icon: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
          border: 'border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40',
        };
      case 'blue':
        return {
          icon: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30',
          border: 'border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/40',
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className={`p-5 rounded-xl border bg-white/90 dark:bg-[#0f1523]/80 backdrop-blur-sm shadow-xs dark:shadow-none transition-all ${theme.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${theme.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500 dark:text-slate-400 font-mono">{unit}</span>}
      </div>

      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}
