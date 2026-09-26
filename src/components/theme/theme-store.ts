// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from '@/components/theme/theme-constants';

const themeListeners = new Set<() => void>();

function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system';
}

export function getStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') {
    return defaultTheme;
  }
  try {
    const item = window.localStorage.getItem(storageKey);
    if (isTheme(item)) {
      return item;
    }
  } catch {
    // Storage access may be blocked in sandboxed environments.
  }
  return defaultTheme;
}

export function getSystemThemeSnapshot(): ResolvedTheme {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getSystemThemeServerSnapshot(): ResolvedTheme {
  return 'light';
}

export function subscribeToSystemTheme(callback: () => void): () => void {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return () => {};
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function notifyThemeListeners(): void {
  for (const listener of themeListeners) {
    listener();
  }
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== THEME_STORAGE_KEY) {
    return;
  }
  notifyThemeListeners();
}

export function subscribeToStoredTheme(callback: () => void): () => void {
  themeListeners.add(callback);
  if (typeof window !== 'undefined' && themeListeners.size === 1) {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    themeListeners.delete(callback);
    if (typeof window !== 'undefined' && themeListeners.size === 0) {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function setStoredTheme(storageKey: string, theme: Theme): void {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Ignored if storage is blocked
  }
  notifyThemeListeners();
}

export function applyResolvedClass(resolvedTheme: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
}

export function readResolvedTheme(
  storageKey: string,
  defaultTheme: Theme,
): ResolvedTheme {
  const stored = getStoredTheme(storageKey, defaultTheme);
  if (stored === 'system') {
    return getSystemThemeSnapshot();
  }
  return stored;
}
