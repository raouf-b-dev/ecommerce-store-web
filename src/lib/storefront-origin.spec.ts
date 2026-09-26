// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStorefrontOrigin } from '@/lib/storefront-origin';

describe('getStorefrontOrigin', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns default http://localhost:3100 in development when unconfigured', () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN;

    expect(getStorefrontOrigin()).toBe('http://localhost:3100');
  });

  it('returns configured origin without trailing slash', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_STOREFRONT_ORIGIN', 'https://shop.example.com///');

    expect(getStorefrontOrigin()).toBe('https://shop.example.com');
  });

  it('throws in production when origin is not configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN;

    expect(() => getStorefrontOrigin()).toThrow(
      /must be configured in production/,
    );
  });

  it('throws in production when origin is localhost or 127.0.0.1', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_STOREFRONT_ORIGIN', 'http://localhost:3100');

    expect(() => getStorefrontOrigin()).toThrow(
      /cannot be localhost in production/,
    );

    vi.stubEnv('NEXT_PUBLIC_STOREFRONT_ORIGIN', 'https://127.0.0.1:3100');
    expect(() => getStorefrontOrigin()).toThrow(
      /cannot be localhost in production/,
    );
  });

  it('returns valid public URL in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_STOREFRONT_ORIGIN', 'https://ecommerce.store.com');

    expect(getStorefrontOrigin()).toBe('https://ecommerce.store.com');
  });

  it('throws if protocol is invalid', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_STOREFRONT_ORIGIN', 'ftp://example.com');

    expect(() => getStorefrontOrigin()).toThrow(/Invalid protocol/);
  });
});
