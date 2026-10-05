'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from '@/context/theme-context';
import { Sun, Moon } from 'lucide-react';

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Avoid hydration mismatch by rendering a stable placeholder until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 opacity-60"
        aria-label="Toggle theme"
      >
        <span className="w-4 h-4 block" />
      </button>
    );
  }

  // When dark: button shows Sun (icon to switch toward light mode)
  // When light: button shows Moon (icon to switch toward dark mode)
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </button>
  );
}
