import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE_URL,
  getApiBaseUrl,
  getBrowserApiBaseUrl,
  getPublicApiBaseUrl,
  getServerApiBaseUrl,
} from '@/lib/api/api-base-url';

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

describe('runtime API base URLs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.__STOREFRONT_CONFIG__;
  });

  it('public URL prefers runtime API_BASE_URL without trailing slash', () => {
    vi.stubEnv('API_BASE_URL', 'https://runtime.example.com/');

    expect(getPublicApiBaseUrl()).toBe('https://runtime.example.com');
  });

  it('public URL falls back to the build-time origin when API_BASE_URL is unset', () => {
    vi.stubEnv('API_BASE_URL', '');

    expect(getPublicApiBaseUrl()).toBe(API_BASE_URL);
  });

  it('public URL throws for an invalid runtime value', () => {
    vi.stubEnv('API_BASE_URL', 'ftp://runtime.example.com');

    expect(() => getPublicApiBaseUrl()).toThrow(/Invalid protocol/);
  });

  it('browser URL prefers the runtime config script value', () => {
    window.__STOREFRONT_CONFIG__ = {
      apiBaseUrl: 'https://browser.example.com/',
    };

    expect(getBrowserApiBaseUrl()).toBe('https://browser.example.com');
  });

  it('browser URL falls back to the build-time origin without runtime config', () => {
    expect(getBrowserApiBaseUrl()).toBe(API_BASE_URL);
  });

  it('server URL prefers API_INTERNAL_BASE_URL over the public URL', () => {
    vi.stubEnv('API_BASE_URL', 'https://runtime.example.com');
    vi.stubEnv('API_INTERNAL_BASE_URL', 'http://api:3000/');

    expect(getServerApiBaseUrl()).toBe('http://api:3000');
  });

  it('server URL falls back to the public URL when API_INTERNAL_BASE_URL is unset', () => {
    vi.stubEnv('API_BASE_URL', 'https://runtime.example.com');
    vi.stubEnv('API_INTERNAL_BASE_URL', '');

    expect(getServerApiBaseUrl()).toBe('https://runtime.example.com');
  });
});
