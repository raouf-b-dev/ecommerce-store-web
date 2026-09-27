import 'server-only';

import { unstable_cache } from 'next/cache';
import { getProducts } from '@/features/catalog/api/get-products';
import { ApiRequestError } from '@/lib/api/parse-api-error';

export const PRODUCTS_PER_SITEMAP = 1000;

export interface SitemapPartition {
  id: number;
}

/**
 * Pure discovery function. Fetches product count from the catalog API and calculates
 * the total number of partitions required. When the API is unavailable (such as during
 * build time in CI environments without an active API backend), falls back to partition 0
 * to allow static builds and root sitemap generation to succeed.
 */
export async function discoverSitemapPartitions(): Promise<SitemapPartition[]> {
  try {
    const firstPage = await getProducts({ page: 1, limit: 1 });
    const total = firstPage.total;
    const partitionCount = Math.max(1, Math.ceil(total / PRODUCTS_PER_SITEMAP));
    return Array.from({ length: partitionCount }, (_, i) => ({ id: i }));
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return [{ id: 0 }];
    }
    throw error;
  }
}

/**
 * Returns the cached partition manifest with a 1-hour bounded cache.
 * Propagates API errors unchanged so incomplete sitemaps are never advertised.
 */
export const getSitemapPartitions: () => Promise<SitemapPartition[]> =
  unstable_cache(discoverSitemapPartitions, ['sitemap-partitions-manifest'], {
    revalidate: 3600, // 1 hour bounded cache
    tags: ['sitemap-partitions'],
  });
