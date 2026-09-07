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

import { logoutRequest } from '@/features/auth/api/auth-api';

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
