import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearInFlightKey,
  getOrCreateInFlightKey,
  renewInFlightKey,
} from './idempotency';

describe('idempotency', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('creates and returns a new UUID key when storage is empty', () => {
    const key = getOrCreateInFlightKey();
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    expect(sessionStorage.getItem('checkout_in_flight_idempotency_key')).toBe(key);
  });

  it('reuses the existing key on subsequent calls', () => {
    const key1 = getOrCreateInFlightKey();
    const key2 = getOrCreateInFlightKey();
    expect(key1).toBe(key2);
  });

  it('renews the key with a fresh UUID', () => {
    const key1 = getOrCreateInFlightKey();
    const key2 = renewInFlightKey();
    expect(key1).not.toBe(key2);
    expect(key2).toMatch(/^[0-9a-f-]{36}$/);
    expect(sessionStorage.getItem('checkout_in_flight_idempotency_key')).toBe(key2);
  });

  it('clears the stored in-flight key', () => {
    getOrCreateInFlightKey();
    clearInFlightKey();
    expect(sessionStorage.getItem('checkout_in_flight_idempotency_key')).toBeNull();
  });
});
