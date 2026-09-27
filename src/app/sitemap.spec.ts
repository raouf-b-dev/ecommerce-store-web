import { beforeEach, describe, expect, it, vi } from 'vitest';
import sitemap, {
  generateSitemaps,
  PRODUCTS_PER_SITEMAP,
} from '@/app/sitemap';
import * as getProductsModule from '@/features/catalog/api/get-products';
import * as getCategoriesModule from '@/features/catalog/api/get-categories';
import * as storefrontOriginModule from '@/lib/storefront-origin';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import type { Category, PaginatedProducts } from '@/features/catalog/types';
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

  const sampleCategories: Category[] = [
    {
      id: 1,
      name: 'Apparel',
      slug: 'apparel',
      isActive: true,
      productCount: 5,
    },
    {
      id: 2,
      name: 'Empty',
      slug: 'empty',
      isActive: true,
      productCount: 0,
    },
    {
      id: 3,
      name: 'Inactive',
      slug: 'inactive',
      isActive: false,
      productCount: 10,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(storefrontOriginModule, 'getStorefrontOrigin').mockReturnValue(
      origin,
    );
    vi.spyOn(getCategoriesModule, 'getCategories').mockResolvedValue(
      sampleCategories,
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
    it('includes homepage, non-empty categories, products with lastModified in partition 0', async () => {
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
            updatedAt: '2026-02-01T12:00:00.000Z',
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

      expect(entries[0]).toEqual({
        url: origin,
        changeFrequency: 'daily',
        priority: 1.0,
      });

      expect(entries.some((e) => e.url === `${origin}/?categoryId=1`)).toBe(
        true,
      );
      expect(entries.some((e) => e.url.includes('categoryId=2'))).toBe(false);
      expect(entries.some((e) => e.url.includes('categoryId=3'))).toBe(false);

      const productEntry = entries.find((e) =>
        e.url.includes('/products/101'),
      );
      expect(productEntry).toEqual({
        url: `${origin}/products/101`,
        lastModified: new Date('2026-02-01T12:00:00.000Z'),
        changeFrequency: 'daily',
        priority: 0.8,
      });

      expect(getProductsSpy).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
        sortBy: 'id',
        sortOrder: 'asc',
      });
    });

    it('partition 0 with empty catalog returns homepage and non-empty category URLs', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const entries = await sitemap({ id: Promise.resolve('0') });

      expect(entries[0]).toEqual({
        url: origin,
        changeFrequency: 'daily',
        priority: 1.0,
      });
      expect(entries.some((e) => e.url === `${origin}/?categoryId=1`)).toBe(
        true,
      );
    });

    it('omits category URLs when category fetch fails but keeps products', async () => {
      vi.spyOn(getCategoriesModule, 'getCategories').mockRejectedValue(
        new ApiRequestError({ statusCode: 503, message: 'Categories down' }),
      );
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [
          {
            id: 101,
            name: 'Classic Tee',
            slug: 'classic-tee',
            price: 25,
            currency: 'USD',
            sku: 'TSH-01',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const entries = await sitemap({ id: Promise.resolve('0') });

      expect(entries.some((e) => e.url === origin)).toBe(true);
      expect(entries.some((e) => e.url.includes('/products/101'))).toBe(true);
      expect(entries.some((e) => e.url.includes('categoryId='))).toBe(false);
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
            updatedAt: '2026-03-01T00:00:00.000Z',
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
      const getCategoriesSpy = vi.spyOn(
        getCategoriesModule,
        'getCategories',
      );

      const entries = await sitemap({ id: Promise.resolve('1') });

      expect(entries.some((e) => e.url === origin)).toBe(false);
      expect(entries.some((e) => e.url.includes('categoryId='))).toBe(false);
      expect(getCategoriesSpy).not.toHaveBeenCalled();

      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        url: `${origin}/products/2001`,
        lastModified: new Date('2026-03-01T00:00:00.000Z'),
        changeFrequency: 'daily',
        priority: 0.8,
      });

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

      await expect(sitemap({ id: Promise.resolve('1') })).rejects.toThrow();
    });

    it('handles stale manifests: returns 404 when cached partition startPage exceeds API totalPages', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockImplementation(async (params) => {
        if (params.limit === 1) {
          return {
            items: [],
            total: 1500,
            page: 1,
            limit: 1,
            totalPages: 15,
          };
        }
        return {
          items: [],
          total: 500,
          page: params.page,
          limit: 100,
          totalPages: 5,
        };
      });

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
                updatedAt: '2026-01-01T00:00:00.000Z',
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
      expect(calls).toEqual([
        { page: 1, sortBy: 'id', sortOrder: 'asc' },
        { page: 2, sortBy: 'id', sortOrder: 'asc' },
        { page: 3, sortBy: 'id', sortOrder: 'asc' },
      ]);
      expect(entries.some((e) => e.url.includes('/products/100'))).toBe(true);
      expect(entries.some((e) => e.url.includes('/products/200'))).toBe(true);
      expect(entries.some((e) => e.url.includes('/products/300'))).toBe(true);
    });

    it('includes non-empty category URLs from productCount even when products are only in later partitions', async () => {
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
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        total: 1500,
        page: 1,
        limit: 100,
        totalPages: 15,
      });
      vi.spyOn(getCategoriesModule, 'getCategories').mockResolvedValue([
        {
          id: 1,
          name: 'Apparel',
          slug: 'apparel',
          isActive: true,
          productCount: 5,
        },
        {
          id: 5,
          name: 'Later Only',
          slug: 'later-only',
          isActive: true,
          productCount: 20,
        },
      ]);

      const entries = await sitemap({ id: Promise.resolve('0') });

      expect(entries.some((e) => e.url.includes('categoryId=5'))).toBe(true);
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
      expect(entries[0]).toEqual({
        url: origin,
        changeFrequency: 'daily',
        priority: 1.0,
      });
      expect(entries.some((e) => e.url.includes('categoryId=1'))).toBe(true);
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
