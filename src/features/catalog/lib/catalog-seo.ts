import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo/canonical';
import {
  INDEX_FOLLOW_ROBOTS,
  NO_INDEX_FOLLOW_ROBOTS,
} from '@/lib/seo/constants';
import { createPageMetadata, type PageMetadata } from '@/lib/seo/metadata';
import { parsePositiveInt } from '@/lib/list-filters';
import type { Category, CatalogFilterParams } from '@/features/catalog/types';
import {
  DEFAULT_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '@/features/catalog/lib/catalog-params';

export type CatalogCategoryState =
  | { status: 'none' }
  | { status: 'valid'; category: Category; hasProducts: boolean }
  | { status: 'nonexistent' }
  | { status: 'malformed' };

/**
 * Detects if a raw categoryId query value was provided but is not a valid positive integer.
 */
export function isCategoryIdMalformed(
  rawCategoryId: string | string[] | undefined,
): boolean {
  if (rawCategoryId === undefined) {
    return false;
  }
  const single = Array.isArray(rawCategoryId) ? rawCategoryId[0] : rawCategoryId;
  if (single === undefined || single.trim() === '') {
    return true;
  }
  return parsePositiveInt(single) === undefined;
}

/**
 * Returns true if the query uses faceted search/filtering options (search text, price bounds,
 * non-default sort, or non-default limit).
 */
export function isCatalogFacetedVariant(params: CatalogFilterParams): boolean {
  const hasSearch = Boolean(params.search?.trim());
  const hasPrice =
    params.minPrice !== undefined || params.maxPrice !== undefined;
  const hasCustomSort =
    params.sortBy !== DEFAULT_SORT_BY || params.sortOrder !== DEFAULT_SORT_ORDER;
  const hasCustomLimit = params.limit !== DEFAULT_LIMIT;

  return hasSearch || hasPrice || hasCustomSort || hasCustomLimit;
}

/**
 * Generates a normalized canonical URL using only allowlisted parameters and omitting
 * all default values. Filtered pages receive normalized self-canonicals and are never
 * collapsed to the unfiltered root.
 */
export function buildCatalogCanonicalUrl(
  origin: string,
  params: CatalogFilterParams,
): string {
  const allowlisted: Record<string, string | number> = {};

  if (params.search?.trim()) {
    allowlisted.search = params.search.trim();
  }
  if (params.categoryId !== undefined) {
    allowlisted.categoryId = params.categoryId;
  }
  if (params.minPrice !== undefined) {
    allowlisted.minPrice = params.minPrice;
  }
  if (params.maxPrice !== undefined) {
    allowlisted.maxPrice = params.maxPrice;
  }
  if (params.sortBy && params.sortBy !== DEFAULT_SORT_BY) {
    allowlisted.sortBy = params.sortBy;
  }
  if (params.sortOrder && params.sortOrder !== DEFAULT_SORT_ORDER) {
    allowlisted.sortOrder = params.sortOrder;
  }
  if (params.limit !== undefined && params.limit !== DEFAULT_LIMIT) {
    allowlisted.limit = params.limit;
  }
  if (params.page !== undefined && params.page > 1) {
    allowlisted.page = params.page;
  }

  return buildCanonicalUrl(origin, '/', allowlisted);
}

export interface BuildCatalogMetadataOptions {
  origin: string;
  params: CatalogFilterParams;
  categoryState: CatalogCategoryState;
}

/**
 * Pure metadata builder for catalog views. No I/O or network requests.
 */
export function buildCatalogMetadata(
  options: BuildCatalogMetadataOptions,
): PageMetadata {
  const { origin, params, categoryState } = options;
  let title: string;
  let description: string;
  let robots: Metadata['robots'];
  let canonicalUrl: string | undefined = buildCatalogCanonicalUrl(origin, params);

  if (categoryState.status === 'malformed') {
    title = 'Category Not Found';
    description = 'The requested category could not be found.';
    robots = NO_INDEX_FOLLOW_ROBOTS;
    canonicalUrl = undefined;
  } else if (categoryState.status === 'nonexistent') {
    title = 'Category Not Found';
    description = 'The requested category could not be found.';
    robots = NO_INDEX_FOLLOW_ROBOTS;
  } else if (categoryState.status === 'valid') {
    const catName = categoryState.category.name;
    title =
      params.page > 1 ? `${catName} - Page ${params.page}` : catName;
    description =
      params.page > 1
        ? `Browse our collection of ${catName} products - Page ${params.page}.`
        : `Browse our collection of ${catName} products.`;

    if (!categoryState.hasProducts) {
      robots = NO_INDEX_FOLLOW_ROBOTS;
    } else {
      robots = isCatalogFacetedVariant(params)
        ? NO_INDEX_FOLLOW_ROBOTS
        : INDEX_FOLLOW_ROBOTS;
    }
  } else {
    // categoryState.status === 'none' (root catalog)
    if (params.search) {
      title =
        params.page > 1
          ? `Search: "${params.search}" - Page ${params.page}`
          : `Search: "${params.search}"`;
      description = `Search results for "${params.search}" in our store catalog.`;
      robots = NO_INDEX_FOLLOW_ROBOTS;
    } else if (params.page > 1) {
      title = `Browse Products - Page ${params.page}`;
      description = `Explore our catalog of high quality products - Page ${params.page}.`;
      robots = isCatalogFacetedVariant(params)
        ? NO_INDEX_FOLLOW_ROBOTS
        : INDEX_FOLLOW_ROBOTS;
    } else {
      title = 'Browse Products';
      description = 'Explore our catalog of high quality products.';
      robots = isCatalogFacetedVariant(params)
        ? NO_INDEX_FOLLOW_ROBOTS
        : INDEX_FOLLOW_ROBOTS;
    }
  }

  return createPageMetadata({
    title,
    description,
    canonicalUrl,
    robots,
    origin,
  });
}
