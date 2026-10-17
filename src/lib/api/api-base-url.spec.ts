import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl } from '@/lib/api/api-base-url';

describe('getApiBaseUrl', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns default http://localhost:3000 in development when unconfigured', () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    expect(getApiBaseUrl()).toBe('http://localhost:3000');
  });

  it('returns configured URL without trailing slash in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com///');

    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('throws in production when API base URL is not configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    expect(() => getApiBaseUrl()).toThrow(
      /must be configured in production/,
    );
  });

  it('throws if protocol is invalid', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'ftp://api.example.com');

    expect(() => getApiBaseUrl()).toThrow(/Invalid protocol/);
  });
});
