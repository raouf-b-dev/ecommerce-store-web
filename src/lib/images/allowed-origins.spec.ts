import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getConfiguredImageRemotePatterns,
  isAllowedImageOrigin,
} from '@/lib/images/allowed-origins';

vi.mock('@/lib/api/api-base-url', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

describe('isAllowedImageOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows any path and query on the API origin', () => {
    expect(
      isAllowedImageOrigin('http://localhost:3000/media/demo/v1/a.webp'),
    ).toBe(true);
    expect(
      isAllowedImageOrigin('http://localhost:3000/uploads/a.webp?sig=abc'),
    ).toBe(true);
  });

  it('rejects other ports and schemes on the API host', () => {
    expect(isAllowedImageOrigin('http://localhost/a.webp')).toBe(false);
    expect(isAllowedImageOrigin('http://localhost:9999/a.webp')).toBe(false);
    expect(isAllowedImageOrigin('https://localhost:3000/a.webp')).toBe(false);
    expect(isAllowedImageOrigin('ftp://localhost:3000/a.webp')).toBe(false);
  });

  it('rejects unknown hosts and malformed URLs', () => {
    expect(isAllowedImageOrigin('https://evil.com/a.webp')).toBe(false);
    expect(isAllowedImageOrigin('not-a-url')).toBe(false);
  });

  it('allows configured public folders and rejects protocol-relative URLs', () => {
    expect(isAllowedImageOrigin('/mock/products/elec-anc-001.webp')).toBe(true);
    expect(isAllowedImageOrigin('/shop/hero.webp')).toBe(true);
    expect(isAllowedImageOrigin('/shop/hero.webp?x=1')).toBe(false);
    expect(isAllowedImageOrigin('/favicon.ico')).toBe(false);
    expect(isAllowedImageOrigin('//evil.com/pic.jpg')).toBe(false);
    expect(isAllowedImageOrigin('/\\evil.com/pic.jpg')).toBe(false);
    expect(isAllowedImageOrigin('/\t/evil.com/pic.jpg')).toBe(false);
  });

  it('allows extra origins from NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS', () => {
    vi.stubEnv(
      'NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS',
      'cdn.example.com, images.example.com:8443,http://img.local:8080',
    );
    expect(isAllowedImageOrigin('https://cdn.example.com/any/path.webp')).toBe(
      true,
    );
    expect(isAllowedImageOrigin('https://cdn.example.com:8443/a.webp')).toBe(
      false,
    );
    expect(isAllowedImageOrigin('https://images.example.com:8443/a.webp')).toBe(
      true,
    );
    expect(isAllowedImageOrigin('http://img.local:8080/a.webp')).toBe(true);
  });

  it.each([
    'user:pw@a.example.com',
    'b.example.com/?x=1',
    'c.example.com/images',
    'ftp://d.example.com',
    'https://',
  ])('throws on an entry that is not a bare origin: %s', (entry) => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS', entry);
    expect(() => getConfiguredImageRemotePatterns()).toThrow(
      /Invalid image origin/,
    );
  });

  it('dedupes the API origin and shares the patterns next.config uses', () => {
    vi.stubEnv(
      'NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS',
      'cdn.example.com,http://localhost:3000',
    );
    expect(getConfiguredImageRemotePatterns()).toEqual([
      { protocol: 'http', hostname: 'localhost', port: '3000' },
      { protocol: 'https', hostname: 'cdn.example.com', port: '' },
    ]);
  });
});
