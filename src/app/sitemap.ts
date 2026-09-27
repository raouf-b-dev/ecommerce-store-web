import type { MetadataRoute } from 'next';
import { notFound } from 'next/navigation';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { getProducts } from '@/features/catalog/api/get-products';
import { getCategories } from '@/features/catalog/api/get-categories';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import type { PaginatedProducts } from '@/features/catalog/types';
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
 * - Partition 0 best-effort enriches with non-empty category URLs via `productCount` (omits them if categories fail).
 * - Sets `lastModified` from product list `updatedAt`.
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
  let allResults: PaginatedProducts[] = [];
  try {
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

    allResults = [firstResult, ...remainingResults];
  } catch (error) {
    // If the catalog API is unreachable (e.g. during CI build-time):
    // Partition 0 safely falls back to empty products so the root sitemap (with homepage) still builds.
    // Non-zero partitions re-throw to avoid falsely emitting 200 responses for missing slices.
    if (partitionId === 0 && error instanceof ApiRequestError) {
      allResults = [];
    } else {
      throw error;
    }
  }

  // Collect products for this partition
  const productEntries: MetadataRoute.Sitemap = [];
  for (const result of allResults) {
    for (const item of result.items) {
      productEntries.push({
        url: `${origin}/products/${item.id}`,
        lastModified: new Date(item.updatedAt),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  }

  const staticEntries: MetadataRoute.Sitemap = [];

  // Partition 0 includes the storefront homepage and non-empty category URLs.
  if (partitionId === 0) {
    staticEntries.push({
      url: origin,
      changeFrequency: 'daily',
      priority: 1.0,
    });

    try {
      const categories = await getCategories();
      for (const category of categories) {
        if (category.isActive && category.productCount > 0) {
          staticEntries.push({
            url: `${origin}/?categoryId=${category.id}`,
            changeFrequency: 'daily',
            priority: 0.7,
          });
        }
      }
    } catch (error) {
      // Best-effort: omit category URLs when the category API is down; keep products/homepage.
      if (!(error instanceof ApiRequestError)) {
        throw error;
      }
    }
  }

  return [...staticEntries, ...productEntries];
}
