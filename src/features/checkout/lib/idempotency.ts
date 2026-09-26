// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

const IDEMPOTENCY_KEY_STORAGE = 'checkout_in_flight_idempotency_key';

export function getOrCreateInFlightKey(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  try {
    const existing = window.sessionStorage.getItem(IDEMPOTENCY_KEY_STORAGE);
    if (existing && existing.trim()) {
      return existing;
    }
    const newKey = crypto.randomUUID();
    window.sessionStorage.setItem(IDEMPOTENCY_KEY_STORAGE, newKey);
    return newKey;
  } catch {
    return crypto.randomUUID();
  }
}

export function renewInFlightKey(): string {
  const newKey = crypto.randomUUID();
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(IDEMPOTENCY_KEY_STORAGE, newKey);
    } catch {
      // Ignore storage errors
    }
  }
  return newKey;
}

export function clearInFlightKey(): void {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(IDEMPOTENCY_KEY_STORAGE);
    } catch {
      // Ignore storage errors
    }
  }
}
