import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
}

export function getCongestionBadgeClass(level: 'low' | 'moderate' | 'severe'): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (level) {
    case 'low':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        label: 'Low Traffic',
      };
    case 'moderate':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        label: 'Moderate Traffic',
      };
    case 'severe':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        label: 'Severe Congestion',
      };
  }
}
