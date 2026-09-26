// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureFreshAccessToken,
  onSessionRefreshed,
  resetSilentRefreshLatchForTests,
  silentRefreshAccessToken,
  silentRefreshSession,
} from '@/lib/api/silent-refresh';
import { createCustomerAccessToken } from '@/test/create-test-jwt';

vi.mock('@/lib/auth/auth-session', () => ({
  clearAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth/auth-session';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const refreshedPayload = {
  accessToken: 'new-access',
  permissions: ['manage_own_cart'],
  mustChangePassword: false,
};

describe('silent refresh', () => {
  beforeEach(() => {
    resetSilentRefreshLatchForTests();
    vi.mocked(setAccessToken).mockReset();
    vi.mocked(clearAccessToken).mockReset();
    vi.mocked(getAccessToken).mockReset();
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(refreshedPayload)),
    );
  });

  afterEach(() => {
    resetSilentRefreshLatchForTests();
    vi.unstubAllGlobals();
  });

  it('stores and publishes the complete refreshed session', async () => {
    const listener = vi.fn();
    const unsubscribe = onSessionRefreshed(listener);

    await expect(silentRefreshSession()).resolves.toEqual(refreshedPayload);
    expect(setAccessToken).toHaveBeenCalledWith('new-access');
    expect(listener).toHaveBeenCalledWith(refreshedPayload);
    unsubscribe();
  });

  it('single-flights session and access-token callers', async () => {
    const [session, token] = await Promise.all([
      silentRefreshSession(),
      silentRefreshAccessToken(),
    ]);
    expect(session).toEqual(refreshedPayload);
    expect(token).toBe('new-access');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('serializes refresh-cookie rotation through a browser-wide lock', async () => {
    const request = vi.fn(
      async (_name: string, task: () => Promise<unknown>) => task(),
    );
    vi.stubGlobal('navigator', { locks: { request } });

    await silentRefreshSession();

    expect(request).toHaveBeenCalledWith(
      'storefront-session-cookie',
      expect.any(Function),
    );
  });

  it('returns null only when the refresh cookie is invalid', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(silentRefreshSession()).resolves.toBeNull();
    expect(setAccessToken).not.toHaveBeenCalled();
    expect(clearAccessToken).toHaveBeenCalledOnce();
  });

  it.each([429, 500])('throws for transient HTTP %s', async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ statusCode: status, message: 'Unavailable' }, status),
    );
    await expect(silentRefreshSession()).rejects.toMatchObject({
      statusCode: status,
    });
    expect(setAccessToken).not.toHaveBeenCalled();
  });

  it('throws network errors instead of treating them as logout', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Network down'));
    await expect(silentRefreshSession()).rejects.toThrow('Network down');
  });
});

describe('ensureFreshAccessToken', () => {
  beforeEach(() => {
    resetSilentRefreshLatchForTests();
    vi.mocked(setAccessToken).mockReset();
    vi.mocked(getAccessToken).mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(refreshedPayload)),
    );
  });

  afterEach(() => {
    resetSilentRefreshLatchForTests();
    vi.unstubAllGlobals();
  });

  it('uses a current token without refreshing', async () => {
    const current = createCustomerAccessToken({
      exp: Math.floor(Date.now() / 1000) + 120,
    });
    vi.mocked(getAccessToken).mockReturnValue(current);
    await expect(ensureFreshAccessToken()).resolves.toBe(current);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', null],
    [
      'expired',
      createCustomerAccessToken({
        exp: Math.floor(Date.now() / 1000) - 5,
      }),
    ],
  ])('refreshes a %s access token', async (_label, token) => {
    vi.mocked(getAccessToken).mockReturnValue(token);
    await expect(ensureFreshAccessToken()).resolves.toBe('new-access');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
