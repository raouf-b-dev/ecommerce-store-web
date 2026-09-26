// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

export const CART_ID_STORAGE_KEY = 'storefront_cart_id';

export function getStoredCartId(): number | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CART_ID_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }

    // Clear corrupt non-integer / non-positive values
    window.localStorage.removeItem(CART_ID_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export const CART_ID_EVENT = 'storefront:cart-id-change';

export function setStoredCartId(id: number): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  try {
    window.localStorage.setItem(CART_ID_STORAGE_KEY, String(id));
    window.dispatchEvent(new CustomEvent(CART_ID_EVENT, { detail: id }));
  } catch {
    // Gracefully handle storage quota or private browsing errors
  }
}

export function clearStoredCartId(): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(CART_ID_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(CART_ID_EVENT, { detail: null }));
  } catch {
    // Graceful no-op
  }
}
