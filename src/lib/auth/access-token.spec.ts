// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
  createCustomerAccessToken,
  createTestJwt,
} from '@/test/create-test-jwt';
import {
  isAccessTokenUsable,
  msUntilAccessTokenRefresh,
} from '@/lib/auth/access-token';

describe('isAccessTokenUsable', () => {
  it('rejects missing and malformed tokens', () => {
    expect(isAccessTokenUsable(null)).toBe(false);
    expect(isAccessTokenUsable('')).toBe(false);
    expect(isAccessTokenUsable('not-a-jwt')).toBe(false);
  });

  it('accepts a decodable mock JWT without exp', () => {
    expect(isAccessTokenUsable(createCustomerAccessToken())).toBe(true);
  });

  it('rejects tokens within the refresh skew and accepts later expiry', () => {
    const nowMs = 1_700_000_000_000;
    expect(
      isAccessTokenUsable(
        createTestJwt({ exp: Math.floor(nowMs / 1000) + 10 }),
        nowMs,
      ),
    ).toBe(false);
    expect(
      isAccessTokenUsable(
        createTestJwt({ exp: Math.floor(nowMs / 1000) + 120 }),
        nowMs,
      ),
    ).toBe(true);
  });
});

describe('msUntilAccessTokenRefresh', () => {
  it('uses a bounded delay for missing and expired tokens', () => {
    const nowMs = 1_700_000_000_000;
    expect(msUntilAccessTokenRefresh(null, nowMs)).toBe(1_000);
    expect(
      msUntilAccessTokenRefresh(
        createTestJwt({ exp: Math.floor(nowMs / 1000) - 5 }),
        nowMs,
      ),
    ).toBe(1_000);
  });

  it('does not schedule mock JWTs without exp', () => {
    expect(msUntilAccessTokenRefresh(createCustomerAccessToken())).toBeNull();
  });

  it('refreshes before exp using the fixed skew', () => {
    const nowMs = 1_700_000_000_000;
    const token = createTestJwt({ exp: Math.floor(nowMs / 1000) + 120 });
    expect(msUntilAccessTokenRefresh(token, nowMs)).toBe(105_000);
  });
});
