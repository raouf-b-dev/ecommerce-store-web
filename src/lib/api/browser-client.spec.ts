import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/silent-refresh', () => ({
  ensureFreshAccessToken: vi.fn(),
  silentRefreshAccessToken: vi.fn(),
}));
vi.mock('@/lib/auth/auth-session', () => ({
  clearAccessToken: vi.fn(),
}));

import {
  attachAccessToken,
  cacheRequestForRetry,
  recoverFromDomain401,
  shouldRedirectToChangePassword,
} from '@/lib/api/browser-client';
import { getChangePasswordRedirectPath } from '@/lib/auth/auth-routes';
import {
  ensureFreshAccessToken,
  silentRefreshAccessToken,
} from '@/lib/api/silent-refresh';

describe('browser client auth middleware', () => {
  beforeEach(() => {
    vi.mocked(ensureFreshAccessToken).mockReset();
    vi.mocked(silentRefreshAccessToken).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['login', 'register', 'refresh'])(
    'does not recursively refresh the %s operation',
    async (operation) => {
      const request = new Request(
        `http://localhost:3000/v1/authentication/${operation}`,
        { method: 'POST' },
      );
      await attachAccessToken(request);
      expect(ensureFreshAccessToken).not.toHaveBeenCalled();
    },
  );

  it('refreshes and attaches a Bearer for logout', async () => {
    vi.mocked(ensureFreshAccessToken).mockResolvedValue('fresh-token');
    const request = new Request(
      'http://localhost:3000/v1/authentication/logout',
      { method: 'POST' },
    );
    await attachAccessToken(request);
    expect(request.headers.get('Authorization')).toBe('Bearer fresh-token');
  });

  it('does not nest refresh when logout already carries a locked Bearer', async () => {
    const request = new Request(
      'http://localhost:3000/v1/authentication/logout',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer locked-token' },
      },
    );
    await attachAccessToken(request);
    expect(ensureFreshAccessToken).not.toHaveBeenCalled();
    expect(request.headers.get('Authorization')).toBe('Bearer locked-token');
  });

  it('does not nest refresh when change-password already carries a locked Bearer', async () => {
    const request = new Request(
      'http://localhost:3000/v1/authentication/change-password',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer locked-token' },
      },
    );
    await attachAccessToken(request);
    expect(ensureFreshAccessToken).not.toHaveBeenCalled();
    expect(request.headers.get('Authorization')).toBe('Bearer locked-token');
  });

  it('replays a consumed POST body after a successful domain 401 refresh', async () => {
    vi.mocked(silentRefreshAccessToken).mockResolvedValue('fresh-token');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request('http://localhost:3000/v1/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 7, quantity: 2 }),
    });
    cacheRequestForRetry(request);
    await request.text();

    await expect(recoverFromDomain401(request)).resolves.toMatchObject({
      status: 200,
    });
    const replay = fetchMock.mock.calls[0]?.[0] as Request;
    expect(replay.headers.get('Authorization')).toBe('Bearer fresh-token');
    await expect(replay.clone().json()).resolves.toEqual({
      productId: 7,
      quantity: 2,
    });
  });

  it('propagates transient refresh errors without redirecting', async () => {
    const failure = Object.assign(new Error('Unavailable'), {
      statusCode: 500,
    });
    vi.mocked(silentRefreshAccessToken).mockRejectedValue(failure);
    await expect(
      recoverFromDomain401(new Request('http://localhost:3000/v1/orders')),
    ).rejects.toBe(failure);
  });
});

describe('forced-password detection', () => {
  it('accepts MUST_CHANGE_PASSWORD code only', () => {
    expect(
      shouldRedirectToChangePassword(403, '/v1/orders', {
        code: 'MUST_CHANGE_PASSWORD',
      }),
    ).toBe(true);
    expect(
      shouldRedirectToChangePassword(403, '/v1/orders', {
        message: 'Password change required before accessing this resource',
      }),
    ).toBe(false);
  });

  it('ignores auth operations and unrelated responses', () => {
    expect(
      shouldRedirectToChangePassword(403, '/v1/authentication/login', {
        code: 'MUST_CHANGE_PASSWORD',
      }),
    ).toBe(false);
    expect(
      shouldRedirectToChangePassword(403, '/v1/orders', {
        code: 'FORBIDDEN',
      }),
    ).toBe(false);
  });

  it('preserves safe destinations and rejects redirect loops', () => {
    expect(
      getChangePasswordRedirectPath('/products?category=books'),
    ).toBe(
      '/change-password?redirect=%2Fproducts%3Fcategory%3Dbooks',
    );
    expect(getChangePasswordRedirectPath('/login')).toBe(
      '/change-password?redirect=%2F',
    );
    expect(getChangePasswordRedirectPath('//evil.example')).toBe(
      '/change-password?redirect=%2F',
    );
  });
});
