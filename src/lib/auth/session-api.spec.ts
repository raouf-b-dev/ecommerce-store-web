import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  ensureFreshAccessToken: vi.fn(),
  withSessionCookieLock: vi.fn(
    async (task: () => Promise<unknown>) => task(),
  ),
}));

vi.mock('@/lib/api/browser-client', () => ({
  browserClient: { POST: mocks.post },
}));
vi.mock('@/lib/api/silent-refresh', () => ({
  ensureFreshAccessToken: mocks.ensureFreshAccessToken,
  silentRefreshSession: vi.fn(),
  withSessionCookieLock: mocks.withSessionCookieLock,
}));
vi.mock('@/lib/auth/jwt-decode', () => ({
  decodeAccessTokenClaims: vi.fn(() => ({
    sub: '42',
    email: 'shopper@example.com',
    role: 'CUSTOMER',
  })),
}));

import {
  changePasswordRequest,
  logoutRequest,
  PASSWORD_CHANGE_THROTTLE_MESSAGE,
} from '@/lib/auth/session-api';

describe('changePasswordRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureFreshAccessToken.mockResolvedValue('current-token');
  });

  it('ensures fresh token before acquiring lock and passes Authorization header', async () => {
    const callOrder: string[] = [];
    mocks.ensureFreshAccessToken.mockImplementation(async () => {
      callOrder.push('ensureFreshAccessToken');
      return 'current-token';
    });
    mocks.withSessionCookieLock.mockImplementation(async (task) => {
      callOrder.push('withSessionCookieLock');
      return task();
    });
    mocks.post.mockResolvedValue({
      data: {
        accessToken: 'rotated-access-token',
        mustChangePassword: false,
        permissions: ['orders:read'],
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await changePasswordRequest({
      currentPassword: 'Seed123!',
      newPassword: 'Rotated123!',
    });

    expect(callOrder).toEqual([
      'ensureFreshAccessToken',
      'withSessionCookieLock',
    ]);
    expect(mocks.post).toHaveBeenCalledWith(
      '/v1/authentication/change-password',
      {
        body: {
          currentPassword: 'Seed123!',
          newPassword: 'Rotated123!',
        },
        headers: {
          Authorization: 'Bearer current-token',
        },
      },
    );
  });

  it('throws SESSION_EXPIRED and does not acquire lock when no token exists', async () => {
    mocks.ensureFreshAccessToken.mockResolvedValue(null);

    await expect(
      changePasswordRequest({
        currentPassword: 'Seed123!',
        newPassword: 'Rotated123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'SESSION_EXPIRED',
    });

    expect(mocks.withSessionCookieLock).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('returns the clean session represented by the rotated tokens', async () => {
    mocks.post.mockResolvedValue({
      data: {
        accessToken: 'rotated-access-token',
        mustChangePassword: false,
        permissions: ['orders:read'],
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await expect(
      changePasswordRequest({
        currentPassword: 'Seed123!',
        newPassword: 'Rotated123!',
      }),
    ).resolves.toEqual({
      userId: '42',
      email: 'shopper@example.com',
      role: 'CUSTOMER',
      permissions: ['orders:read'],
      mustChangePassword: false,
    });
  });

  it('maps strict authentication throttling to actionable copy', async () => {
    mocks.post.mockResolvedValue({
      data: undefined,
      error: { statusCode: 429, message: 'Too many requests' },
      response: new Response(null, { status: 429 }),
    });

    await expect(
      changePasswordRequest({
        currentPassword: 'Seed123!',
        newPassword: 'Rotated123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 429,
      message: PASSWORD_CHANGE_THROTTLE_MESSAGE,
    });
  });
});

describe('logoutRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureFreshAccessToken.mockResolvedValue('access-token');
  });

  it('serializes cookie revocation and sends the prepared Bearer', async () => {
    mocks.post.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: new Response(null, { status: 204 }),
    });

    await logoutRequest();

    expect(mocks.withSessionCookieLock).toHaveBeenCalledOnce();
    expect(mocks.post).toHaveBeenCalledWith(
      '/v1/authentication/logout',
      {
        body: {},
        headers: { Authorization: 'Bearer access-token' },
      },
    );
  });

  it('does nothing when refresh already proved the cookie invalid', async () => {
    mocks.ensureFreshAccessToken.mockResolvedValue(null);
    await logoutRequest();
    expect(mocks.withSessionCookieLock).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('throws when the API cannot revoke a still-valid session', async () => {
    mocks.post.mockResolvedValue({
      data: undefined,
      error: { statusCode: 500, message: 'Unavailable' },
      response: new Response(
        JSON.stringify({ statusCode: 500, message: 'Unavailable' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      ),
    });

    await expect(logoutRequest()).rejects.toMatchObject({
      statusCode: 500,
      message: 'Unavailable',
    });
  });
});
