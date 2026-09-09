import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  discoverSitemapPartitions,
  getSitemapPartitions,
  PRODUCTS_PER_SITEMAP,
} from '@/features/catalog/lib/sitemap-partitions';
import * as getProductsModule from '@/features/catalog/api/get-products';

vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T): T => fn,
}));

describe('sitemap-partitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('partition boundaries calculation', () => {
    it('returns at least 1 partition when catalog is empty', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
        totalPages: 1,
      });

      const partitions = await discoverSitemapPartitions();
      expect(partitions).toEqual([{ id: 0 }]);
    });

    it('returns exactly 1 partition when total equals PRODUCTS_PER_SITEMAP', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: PRODUCTS_PER_SITEMAP,
        page: 1,
        limit: 1,
        totalPages: 10,
      });

      const partitions = await discoverSitemapPartitions();
      expect(partitions).toEqual([{ id: 0 }]);
    });

    it('calculates multiple partitions when total exceeds PRODUCTS_PER_SITEMAP', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: PRODUCTS_PER_SITEMAP + 1,
        page: 1,
        limit: 1,
        totalPages: 11,
      });

      const partitions = await discoverSitemapPartitions();
      expect(partitions).toEqual([{ id: 0 }, { id: 1 }]);
    });

    it('calculates 3 partitions for 2500 products', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: 2500,
        page: 1,
        limit: 1,
        totalPages: 25,
      });

      const partitions = await discoverSitemapPartitions();
      expect(partitions).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }]);
    });
  });

  describe('error propagation', () => {
    it('propagates API failures unchanged instead of returning a degraded single partition', async () => {
      const apiError = new Error('Database connection failed');
      vi.spyOn(getProductsModule, 'getProducts').mockRejectedValue(apiError);

      await expect(discoverSitemapPartitions()).rejects.toThrow(
        'Database connection failed',
      );
      await expect(getSitemapPartitions()).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('getSitemapPartitions returns discovered partitions', async () => {
      vi.spyOn(getProductsModule, 'getProducts').mockResolvedValue({
        items: [],
        total: 1500,
        page: 1,
        limit: 1,
        totalPages: 15,
      });

      const partitions = await getSitemapPartitions();
      expect(partitions).toEqual([{ id: 0 }, { id: 1 }]);
    });
  });
});
