import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getConfiguredImageRemotePatterns,
  isAllowedImageOrigin,
} from '@/lib/images/allowed-origins';

describe('isAllowedImageOrigin', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalHosts = process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS;

  afterEach(() => {
    vi.stubEnv('NODE_ENV', originalEnv);
    if (originalHosts === undefined) {
      delete process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS;
    } else {
      process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS = originalHosts;
    }
  });

  it('allows localhost:3000 in non-production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS;
    expect(isAllowedImageOrigin('http://localhost:3000/pic.jpg')).toBe(true);
    expect(isAllowedImageOrigin('http://127.0.0.1:3000/pic.jpg')).toBe(true);
  });

  it('rejects localhost without an explicit port', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAllowedImageOrigin('http://localhost/pic.jpg')).toBe(false);
    expect(isAllowedImageOrigin('http://127.0.0.1/pic.jpg')).toBe(false);
  });

  it('rejects localhost on the wrong port', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAllowedImageOrigin('http://localhost:9999/pic.jpg')).toBe(false);
  });

  it('rejects unknown hosts', () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS;
    expect(isAllowedImageOrigin('https://evil.com/pic.jpg')).toBe(false);
    expect(isAllowedImageOrigin('ftp://localhost:3000/pic.jpg')).toBe(false);
    expect(isAllowedImageOrigin('not-a-url')).toBe(false);
  });

  it('allows production hosts from NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS', () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS = 'cdn.example.com,http://img.local:8080';
    expect(isAllowedImageOrigin('https://cdn.example.com/a.jpg')).toBe(true);
    expect(isAllowedImageOrigin('http://img.local:8080/a.jpg')).toBe(true);
    expect(isAllowedImageOrigin('http://localhost:3000/a.jpg')).toBe(false);
  });

  it('shares the same patterns next.config would use', () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS = 'cdn.example.com';
    expect(getConfiguredImageRemotePatterns()).toEqual([
      { protocol: 'https', hostname: 'cdn.example.com' },
    ]);
  });
});
