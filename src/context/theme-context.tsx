'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
}

const THEME_CHANGE_EVENT = 'niu-theme-change';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getSnapshot(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('niu-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // fallback
  }
  return 'dark';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem('niu-theme', newTheme);
      applyThemeClass(newTheme);
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const current = getSnapshot();
    const nextTheme: Theme = current === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('niu-theme', nextTheme);
      applyThemeClass(nextTheme);
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }, []);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
