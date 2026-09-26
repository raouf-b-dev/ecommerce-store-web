// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it } from 'vitest';
import {
  CART_ID_STORAGE_KEY,
  clearStoredCartId,
  getStoredCartId,
  setStoredCartId,
} from './cart-storage';

describe('cart-storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when no cart ID is stored', () => {
    expect(getStoredCartId()).toBeNull();
  });

  it('stores and retrieves a valid cart ID', () => {
    setStoredCartId(42);
    expect(getStoredCartId()).toBe(42);
    expect(window.localStorage.getItem(CART_ID_STORAGE_KEY)).toBe('42');
  });

  it('rejects storing non-positive numbers or floats', () => {
    setStoredCartId(0);
    expect(getStoredCartId()).toBeNull();

    setStoredCartId(-5);
    expect(getStoredCartId()).toBeNull();

    setStoredCartId(3.14);
    expect(getStoredCartId()).toBeNull();
  });

  it('clears corrupt non-integer stored values on read', () => {
    window.localStorage.setItem(CART_ID_STORAGE_KEY, 'corrupted-id');
    expect(getStoredCartId()).toBeNull();
    expect(window.localStorage.getItem(CART_ID_STORAGE_KEY)).toBeNull();
  });

  it('clears stored cart ID', () => {
    setStoredCartId(12);
    expect(getStoredCartId()).toBe(12);

    clearStoredCartId();
    expect(getStoredCartId()).toBeNull();
    expect(window.localStorage.getItem(CART_ID_STORAGE_KEY)).toBeNull();
  });
});
