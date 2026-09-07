import { describe, expect, it } from 'vitest';
import { createCustomerAccessToken } from '@/test/create-test-jwt';
import {
  getSessionRefetchInterval,
  getSessionRefetchOnFocusOrReconnect,
  SESSION_REFRESH_ERROR_BACKOFF_MS,
} from '@/lib/auth/session-query-policy';

describe('getSessionRefetchInterval', () => {
  it('does not poll without a session', () => {
    expect(
      getSessionRefetchInterval({
        hasSession: false,
        hasError: false,
        accessToken: null,
      }),
    ).toBe(false);
  });

  it('backs off after a transient refresh error', () => {
    expect(
      getSessionRefetchInterval({
        hasSession: true,
        hasError: true,
        accessToken: createCustomerAccessToken(),
      }),
    ).toBe(SESSION_REFRESH_ERROR_BACKOFF_MS);
  });

  it('schedules from exp and skips tokens without exp', () => {
    expect(
      getSessionRefetchInterval({
        hasSession: true,
        hasError: false,
        accessToken: createCustomerAccessToken({
          exp: Math.floor(Date.now() / 1000) + 120,
        }),
      }),
    ).toBeGreaterThanOrEqual(1_000);
    expect(
      getSessionRefetchInterval({
        hasSession: true,
        hasError: false,
        accessToken: createCustomerAccessToken(),
      }),
    ).toBe(false);
  });
});

describe('getSessionRefetchOnFocusOrReconnect', () => {
  it('refetches only when a session has an unusable token', () => {
    expect(
      getSessionRefetchOnFocusOrReconnect({
        hasSession: false,
        accessToken: null,
      }),
    ).toBe(false);
    expect(
      getSessionRefetchOnFocusOrReconnect({
        hasSession: true,
        accessToken: null,
      }),
    ).toBe('always');
    expect(
      getSessionRefetchOnFocusOrReconnect({
        hasSession: true,
        accessToken: createCustomerAccessToken({
          exp: Math.floor(Date.now() / 1000) + 120,
        }),
      }),
    ).toBe(false);
  });
});
