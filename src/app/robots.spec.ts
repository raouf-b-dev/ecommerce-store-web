// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as storefrontOriginModule from '@/lib/storefront-origin';

const mocks = vi.hoisted(() => ({
  getSitemapPartitions: vi.fn(),
}));

vi.mock('@/features/catalog/lib/sitemap-partitions', () => ({
  getSitemapPartitions: mocks.getSitemapPartitions,
}));

import robots from '@/app/robots';

describe('robots', () => {
  const origin = 'https://storefront.test';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(storefrontOriginModule, 'getStorefrontOrigin').mockReturnValue(
      origin,
    );
    mocks.getSitemapPartitions.mockResolvedValue([{ id: 0 }]);
  });

  it('references generated sitemaps and keeps appropriate allows/disallows', async () => {
    const config = await robots();

    // Sitemap references dynamically match generated partitions
    expect(config.sitemap).toEqual(['https://storefront.test/sitemap/0.xml']);

    // Rules
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules).toBeDefined();
    expect(rules?.userAgent).toBe('*');
    // Requirement 7: Allow: / already covers /products/
    expect(rules?.allow).toEqual(['/']);

    // Private routes are NOT disallowed so crawlers can observe page-level noindex
    expect(rules?.disallow ?? []).not.toContain('/cart');
    expect(rules?.disallow ?? []).not.toContain('/checkout');
    expect(rules?.disallow ?? []).not.toContain('/login');
    expect(rules?.disallow ?? []).not.toContain('/register');
    expect(rules?.disallow ?? []).not.toContain('/account');
    expect(rules?.disallow ?? []).not.toContain('/status');
  });

  it('maps multiple partitions dynamically to sitemap array', async () => {
    mocks.getSitemapPartitions.mockResolvedValue([
      { id: 0 },
      { id: 1 },
    ]);

    const config = await robots();
    expect(config.sitemap).toEqual([
      'https://storefront.test/sitemap/0.xml',
      'https://storefront.test/sitemap/1.xml',
    ]);
  });

  it('propagates partition discovery failures unchanged', async () => {
    mocks.getSitemapPartitions.mockRejectedValue(
      new Error('Catalog service unreachable'),
    );

    await expect(robots()).rejects.toThrow('Catalog service unreachable');
  });
});
