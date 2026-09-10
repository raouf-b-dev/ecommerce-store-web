import { beforeEach, describe, expect, it, vi } from 'vitest';
import sitemap, {
  generateSitemaps,
  PRODUCTS_PER_SITEMAP,
} from '@/app/sitemap';
import * as getProductsModule from '@/features/catalog/api/get-products';
import * as storefrontOriginModule from '@/lib/storefront-origin';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import type { PaginatedProducts } from '@/features/catalog/types';
import type * as sitemapPartitionsModule from '@/features/catalog/lib/sitemap-partitions';

vi.mock('@/features/catalog/lib/sitemap-partitions', async (importOriginal) => {
  const actual =
    await importOriginal<typeof sitemapPartitionsModule>();
  return {
    ...actual,
    getSitemapPartitions: vi.fn().mockImplementation(async () => {
      return actual.discoverSitemapPartitions();
    }),
  };
});

describe('sitemap and generateSitemaps', () => {
  const origin = 'https://storefront.test';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(storefrontOriginModule, 'getStorefrontOrigin').mockReturnValue(
      origin,
    );
  });

  describe('generateSitemaps', () => {
    it('returns at least one partition when catalog is empty', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
        totalPages: 1,
      });

      const sitemaps = await generateSitemaps();
      expect(sitemaps).toEqual([{ id: 0 }]);
    });

    it('calculates partition boundaries based on PRODUCTS_PER_SITEMAP', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: PRODUCTS_PER_SITEMAP * 2 + 50, // 2050 products -> 3 partitions
        page: 1,
        limit: 1,
        totalPages: 1,
      });

      const sitemaps = await generateSitemaps();
      expect(sitemaps).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }]);
    });

    it('propagates unexpected non-API failures unchanged', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockRejectedValue(
        new Error('API offline'),
      );

      await expect(generateSitemaps()).rejects.toThrow('API offline');
    });

    it('falls back to partition 0 when catalog API is unavailable for build safety', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockRejectedValue(
        new ApiRequestError({ statusCode: 503, message: 'API unavailable' }),
      );

      const sitemaps = await generateSitemaps();
      expect(sitemaps).toEqual([{ id: 0 }]);
    });
  });

  describe('sitemap generation', () => {
    it('includes homepage, products, completely omits lastModified, and omits category URLs in partition 0', async () => {
      const pageResult: PaginatedProducts = {
        items: [
          {
            id: 101,
            name: 'Classic Tee',
            slug: 'classic-tee',
            price: 25,
            currency: 'USD',
            sku: 'TSH-01',
            isActive: true,
            categoryId: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      };

      const getProductsSpy = vi
        .spyOn(getProductsModule, 'getProducts')
        .mockResolvedValue(pageResult);

      const entries = await sitemap({ id: Promise.resolve('0') });

      // Check homepage
      expect(entries[0]).toEqual({
        url: origin,
        changeFrequency: 'daily',
        priority: 1.0,
      });
      expect(entries[0]).not.toHaveProperty('lastModified');

      // Check product entry
      expect(entries[1]).toEqual({
        url: `${origin}/products/101`,
        changeFrequency: 'daily',
        priority: 0.8,
      });
      expect(entries[1]).not.toHaveProperty('lastModified');

      // Category URLs are intentionally omitted from sitemaps pending backend productCount contract
      expect(entries.some((e) => e.url.includes('categoryId='))).toBe(false);

      // Verifies deterministic ordering with sortBy: 'id' and sortOrder: 'asc'
      expect(getProductsSpy).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
        sortBy: 'id',
        sortOrder: 'asc',
      });
    });

    it('partition 0 with empty catalog returns only homepage', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const entries = await sitemap({ id: Promise.resolve('0') });

      expect(entries).toEqual([
        {
          url: origin,
          changeFrequency: 'daily',
          priority: 1.0,
        },
      ]);
    });

    it('partition > 0 contains only bounded product entries and skips homepage and categories', async () => {
      const pageResult: PaginatedProducts = {
        items: [
          {
            id: 2001,
            name: 'Later Batch Product',
            slug: 'later-batch',
            price: 99,
            currency: 'USD',
            sku: 'BAT-01',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        total: 1050,
        page: 11,
        limit: 100,
        totalPages: 11,
      };

      const getProductsSpy = vi
        .spyOn(getProductsModule, 'getProducts')
        .mockResolvedValue(pageResult);

      const entries = await sitemap({ id: Promise.resolve('1') });

      // Must not contain homepage or category URLs
      expect(entries.some((e) => e.url === origin)).toBe(false);
      expect(entries.some((e) => e.url.includes('categoryId='))).toBe(false);

      // Contains partition 1 product
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        url: `${origin}/products/2001`,
        changeFrequency: 'daily',
        priority: 0.8,
      });
      expect(entries[0]).not.toHaveProperty('lastModified');

      // Verifies bounded starting page with deterministic sort
      expect(getProductsSpy).toHaveBeenCalledWith({
        page: 11,
        limit: 100,
        sortBy: 'id',
        sortOrder: 'asc',
      });
    });

    it('calls notFound for malformed, negative, or invalid partition IDs without fetching products', async () => {
      const getProductsSpy = vi.spyOn(getProductsModule, 'getProducts');

      await expect(sitemap({ id: Promise.resolve('abc') })).rejects.toThrow();
      await expect(sitemap({ id: Promise.resolve('-1') })).rejects.toThrow();
      await expect(sitemap({ id: Promise.resolve('1.5') })).rejects.toThrow();

      expect(getProductsSpy).not.toHaveBeenCalled();
    });

    it('calls notFound for out-of-range partition IDs based on discovered partitions', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: 10,
        page: 1,
        limit: 1,
        totalPages: 1,
      });

      // Total 10 products means only partition 0 exists (partitionCount = 1). Partition 1 is out of range.
      await expect(sitemap({ id: Promise.resolve('1') })).rejects.toThrow();
    });

    it('handles stale manifests: returns 404 when cached partition startPage exceeds API totalPages', async () => {
      // Suppose partition manifest discovery previously returned 2 partitions because total was 1500 products
      vi.spyOn(getProductsModule, 'getProducts').mockImplementation(async (params) => {
        if (params.limit === 1) {
          // Discovery returns 2 partitions (id: 0, id: 1)
          return {
            items: [],
            total: 1500,
            page: 1,
            limit: 1,
            totalPages: 15,
          };
        }
        // But when partition 1 fetches page 11, the catalog has shrunk to 500 products (totalPages: 5)
        return {
          items: [],
          total: 500,
          page: params.page,
          limit: 100,
          totalPages: 5,
        };
      });

      // Partition 1 startPage is 11, but current totalPages is 5 -> must trigger notFound (404)
      await expect(sitemap({ id: Promise.resolve('1') })).rejects.toThrow();
    });

    it('parallelizes fetches for remaining pages within a partition using deterministic sorting', async () => {
      const calls: { page: number; sortBy?: string; sortOrder?: string }[] = [];
      vi.spyOn(getProductsModule, 'getProducts').mockImplementation(
        async (params) => {
          if (params.limit === 100) {
            calls.push({
              page: params.page,
              sortBy: params.sortBy,
              sortOrder: params.sortOrder,
            });
          }
          return {
            items: [
              {
                id: params.page * 100,
                name: `Product on page ${params.page}`,
                slug: `product-${params.page}`,
                price: 10,
                currency: 'USD',
                sku: `SKU-${params.page}`,
                isActive: true,
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            total: 300,
            page: params.page,
            limit: 100,
            totalPages: 3,
          };
        },
      );

      const entries = await sitemap({ id: Promise.resolve('0') });
      // Partition 0 pages 1, 2, 3 should all be fetched with deterministic sorting
      expect(calls).toEqual([
        { page: 1, sortBy: 'id', sortOrder: 'asc' },
        { page: 2, sortBy: 'id', sortOrder: 'asc' },
        { page: 3, sortBy: 'id', sortOrder: 'asc' },
      ]);
      // Products from all pages should be present in entries
      expect(entries.some((e) => e.url.includes('/products/100'))).toBe(true);
      expect(entries.some((e) => e.url.includes('/products/200'))).toBe(true);
      expect(entries.some((e) => e.url.includes('/products/300'))).toBe(true);
    });

    it('omits category URLs from partition 0 even when categories have products only in partition 1+', async () => {
      // Partition 0 only has products for category 1
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [
          {
            id: 101,
            name: 'P0 Product',
            slug: 'p0-prod',
            price: 10,
            currency: 'USD',
            sku: 'SKU-P0',
            isActive: true,
            categoryId: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        total: 1500, // Multi-partition catalog
        page: 1,
        limit: 100,
        totalPages: 15,
      });

      const entries = await sitemap({ id: Promise.resolve('0') });

      // Omission policy: Category 5 (whose products only appear in partition 1)
      // is not mistakenly advertised or falsely evaluated against partition 0.
      // Category URLs are omitted until backend provides productCount contract.
      expect(entries.some((e) => e.url.includes('categoryId='))).toBe(false);
      expect(entries.some((e) => e.url === origin)).toBe(true);
      expect(entries.some((e) => e.url.includes('/products/101'))).toBe(true);
    });

    it('re-throws when product fetch fails', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockRejectedValue(
        new Error('Product fetch failed'),
      );

      await expect(sitemap({ id: Promise.resolve('0') })).rejects.toThrow(
        'Product fetch failed',
      );
    });

    it('partition 0 emits homepage without crashing when catalog API is unavailable', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockRejectedValue(
        new ApiRequestError({ statusCode: 503, message: 'API unavailable' }),
      );

      const entries = await sitemap({ id: Promise.resolve('0') });
      expect(entries).toEqual([
        {
          url: origin,
          changeFrequency: 'daily',
          priority: 1.0,
        },
      ]);
    });

    it('re-throws when product fetch fails on partition > 0 even for ApiRequestError', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockImplementation(async (params) => {
        if (params.limit === 1) {
          return { items: [], total: 1500, page: 1, limit: 1, totalPages: 15 };
        }
        throw new ApiRequestError({ statusCode: 503, message: 'API unavailable' });
      });

      await expect(sitemap({ id: Promise.resolve('1') })).rejects.toThrow(
        ApiRequestError,
      );
    });
  });
});
