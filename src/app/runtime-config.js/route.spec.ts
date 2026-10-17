import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  connection: vi.fn<() => Promise<void>>(),
}));

vi.mock('next/server', () => ({
  connection: mocks.connection,
}));

import { GET } from '@/app/runtime-config.js/route';

describe('GET /runtime-config.js', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('serves the runtime API base URL as an uncached script', async () => {
    vi.stubEnv('API_BASE_URL', 'https://runtime.example.com/');

    const response = await GET();

    expect(mocks.connection).toHaveBeenCalledOnce();
    expect(response.headers.get('Content-Type')).toBe(
      'text/javascript; charset=utf-8',
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).toBe(
      'window.__STOREFRONT_CONFIG__ = {"apiBaseUrl":"https://runtime.example.com"};\n',
    );
  });

  it('fails instead of serving an invalid runtime value', async () => {
    vi.stubEnv('API_BASE_URL', 'not a url');

    await expect(GET()).rejects.toThrow();
  });
});
