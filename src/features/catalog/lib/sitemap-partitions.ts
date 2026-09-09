import 'server-only';

import { unstable_cache } from 'next/cache';
import { getProducts } from '@/features/catalog/api/get-products';

export const PRODUCTS_PER_SITEMAP = 1000;

export interface SitemapPartition {
  id: number;
}

/**
 * Pure discovery function. Fetches product count from the catalog API and calculates
 * the total number of partitions required. Propagates any API failure unchanged so
 * degraded or incomplete sitemap manifests are never advertised.
 */
export async function discoverSitemapPartitions(): Promise<SitemapPartition[]> {
  const firstPage = await getProducts({ page: 1, limit: 1 });
  const total = firstPage.total;
  const partitionCount = Math.max(1, Math.ceil(total / PRODUCTS_PER_SITEMAP));
  return Array.from({ length: partitionCount }, (_, i) => ({ id: i }));
}

/**
 * Returns the cached partition manifest with a 1-hour bounded cache.
 * Propagates API errors unchanged so incomplete sitemaps are never advertised.
 */
export const getSitemapPartitions: () => Promise<SitemapPartition[]> =
  unstable_cache(
    discoverSitemapPartitions,
    ['sitemap-partitions-manifest'],
    {
      revalidate: 3600, // 1 hour bounded cache
      tags: ['sitemap-partitions'],
    },
  );
