import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

// Every text/background pair below meets WCAG AA (4.5:1 for body text).
export type Colors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  success: string;
  warning: string;
  chip: string;
  overlay: string;
};

const palettes: { light: Colors; dark: Colors } = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#111827',
    muted: '#4b5563',
    border: '#d1d5db',
    primary: '#4338ca',
    primaryText: '#ffffff',
    danger: '#b91c1c',
    success: '#15803d',
    warning: '#92400e',
    chip: '#e5e7eb',
    overlay: 'rgba(15, 23, 42, 0.55)',
  },
  dark: {
    background: '#0b1120',
    surface: '#111827',
    text: '#f1f5f9',
    muted: '#cbd5e1',
    border: '#334155',
    primary: '#4f46e5',
    primaryText: '#ffffff',
    danger: '#fca5a5',
    success: '#86efac',
    warning: '#fcd34d',
    chip: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

type ThemeValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
};

const THEME_KEY = 'quickstay.theme';

const ThemeContext = createContext<ThemeValue | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_KEY, next);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const value = useMemo<ThemeValue>(
    () => ({ mode, isDark, colors: isDark ? palettes.dark : palettes.light, setMode }),
    [mode, isDark, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeValue => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
};
