'use client';

import { createContext, useLayoutEffect, useSyncExternalStore, type ReactNode } from 'react';
import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from '@/components/theme/theme-constants';
import {
  applyResolvedClass,
  getStoredTheme,
  getSystemThemeServerSnapshot,
  getSystemThemeSnapshot,
  readResolvedTheme,
  setStoredTheme,
  subscribeToStoredTheme,
  subscribeToSystemTheme,
} from '@/components/theme/theme-store';

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
};

export const ThemeContext = createContext<ThemeProviderState | null>(null);

export type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeToStoredTheme,
    () => getStoredTheme(storageKey, defaultTheme),
    () => defaultTheme,
  );

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot,
  );

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? systemTheme : theme;

  useLayoutEffect(() => {
    applyResolvedClass(readResolvedTheme(storageKey, defaultTheme));
  }, [theme, systemTheme, storageKey, defaultTheme]);

  function setTheme(newTheme: Theme) {
    setStoredTheme(storageKey, newTheme);
  }

  return (
    <ThemeContext value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext>
  );
}
