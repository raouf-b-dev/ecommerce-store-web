import type { MetadataRoute } from 'next';
import { notFound } from 'next/navigation';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { getProducts } from '@/features/catalog/api/get-products';
import {
  getSitemapPartitions,
  PRODUCTS_PER_SITEMAP,
} from '@/features/catalog/lib/sitemap-partitions';

export { PRODUCTS_PER_SITEMAP };
const API_PAGE_LIMIT = 100;

/**
 * Discovers partition IDs using the shared server-only helper.
 */
export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  return await getSitemapPartitions();
}

/**
 * Generates sitemap entries for a given partition ID using the exact Next.js 16 signature.
 *
 * - Strictly validates partition ID as a non-negative integer within bounds.
 * - Enforces deterministic sorting (sortBy: 'id', sortOrder: 'asc') to avoid duplicate/missing entries during generation.
 * - Handles stale manifests: if the catalog shrunk and startPage > totalPages, returns 404 rather than an empty 200 sitemap.
 * - Omits category URLs from sitemaps until a backend productCount/hasProducts contract exists on CategoryResponseDto.
 *   Category links remain fully discoverable to search crawlers via internal navigation links.
 * - Omits lastModified until the catalog API provides an accurate updatedAt timestamp.
 */
export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const rawId = await props.id;
  const str = String(rawId ?? '').trim();
  if (!/^\d+$/.test(str)) {
    notFound();
  }

  const partitionId = Number(str);
  if (!Number.isSafeInteger(partitionId) || partitionId < 0) {
    notFound();
  }

  // Validate partition is within current discovered range
  const partitions = await getSitemapPartitions();
  if (partitionId >= partitions.length) {
    notFound();
  }

  const origin = getStorefrontOrigin();

  // Calculate bounded page range for this sitemap partition
  const startProductIndex = partitionId * PRODUCTS_PER_SITEMAP;
  const endProductIndex = startProductIndex + PRODUCTS_PER_SITEMAP;
  const startPage = Math.floor(startProductIndex / API_PAGE_LIMIT) + 1;
  const maxPage = Math.ceil(endProductIndex / API_PAGE_LIMIT);

  // Fetch initial page with deterministic sorting
  const firstResult = await getProducts({
    page: startPage,
    limit: API_PAGE_LIMIT,
    sortBy: 'id',
    sortOrder: 'asc',
  });

  // Handle stale manifests: if the catalog shrunk and startPage exceeds current totalPages,
  // return 404 rather than an empty 200 sitemap.
  const effectiveTotalPages = Math.max(1, firstResult.totalPages);
  if (startPage > effectiveTotalPages) {
    notFound();
  }

  const totalPages = firstResult.totalPages;
  const lastPageToFetch = Math.min(maxPage, totalPages);

  // Bounded parallel fetch for remaining pages within this partition (at most 9 concurrent requests)
  const remainingPages: number[] = [];
  for (let p = startPage + 1; p <= lastPageToFetch; p++) {
    remainingPages.push(p);
  }

  const remainingResults =
    remainingPages.length > 0
      ? await Promise.all(
          remainingPages.map((page) =>
            getProducts({
              page,
              limit: API_PAGE_LIMIT,
              sortBy: 'id',
              sortOrder: 'asc',
            }),
          ),
        )
      : [];

  const allResults = [firstResult, ...remainingResults];

  // Collect products for this partition
  const productEntries: MetadataRoute.Sitemap = [];
  for (const result of allResults) {
    for (const item of result.items) {
      productEntries.push({
        url: `${origin}/products/${item.id}`,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  }

  const staticEntries: MetadataRoute.Sitemap = [];

  // Partition 0 includes the storefront homepage.
  // Category URLs are intentionally omitted from sitemaps for now: the catalog API
  // does not provide productCount or hasProducts on CategoryResponseDto, so global emptiness
  // across a multi-partition catalog cannot be inferred without N+1 queries.
  // Adding category URLs to the sitemap requires a backend productCount/hasProducts contract.
  // Category links remain naturally crawlable through standard header and storefront navigation.
  if (partitionId === 0) {
    staticEntries.push({
      url: origin,
      changeFrequency: 'daily',
      priority: 1.0,
    });
  }

  return [...staticEntries, ...productEntries];
}
