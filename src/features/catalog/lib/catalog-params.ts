import type { Route } from 'next';
import {
  parseNonNegativeNumber,
  parsePositiveInt,
} from '@/lib/list-filters';
import type {
  CatalogFilterParams,
  ProductSortBy,
  ProductsQueryParams,
  SortOrder,
} from '@/features/catalog/types';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 100;
export const DEFAULT_SORT_BY: ProductSortBy = 'createdAt';
export const DEFAULT_SORT_ORDER: SortOrder = 'desc';

export const SORT_BY_OPTIONS: readonly { value: ProductSortBy; label: string }[] = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'price', label: 'Price' },
  { value: 'name', label: 'Name' },
  { value: 'id', label: 'ID' },
] as const;

export const SORT_ORDER_OPTIONS: readonly { value: SortOrder; label: string }[] = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
] as const;

function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function isValidSortBy(value: string | undefined): value is ProductSortBy {
  return (
    value === 'createdAt' ||
    value === 'price' ||
    value === 'name' ||
    value === 'id'
  );
}

function isValidSortOrder(value: string | undefined): value is SortOrder {
  return value === 'asc' || value === 'desc';
}

export function parseCatalogSearchParams(
  raw: Record<string, string | string[] | undefined>,
): CatalogFilterParams {
  const rawSearch = getSingleParam(raw.search)?.trim();
  const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

  const categoryId = parsePositiveInt(getSingleParam(raw.categoryId));

  const rawPage = parsePositiveInt(getSingleParam(raw.page));
  const page = rawPage && rawPage >= 1 ? rawPage : DEFAULT_PAGE;

  const rawLimit = parsePositiveInt(getSingleParam(raw.limit));
  const limit = rawLimit ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  let minPrice = parseNonNegativeNumber(getSingleParam(raw.minPrice));
  let maxPrice = parseNonNegativeNumber(getSingleParam(raw.maxPrice));

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    minPrice = undefined;
    maxPrice = undefined;
  }

  const rawSortBy = getSingleParam(raw.sortBy);
  const sortBy = isValidSortBy(rawSortBy) ? rawSortBy : DEFAULT_SORT_BY;

  const rawSortOrder = getSingleParam(raw.sortOrder);
  const sortOrder = isValidSortOrder(rawSortOrder)
    ? rawSortOrder
    : DEFAULT_SORT_ORDER;

  return {
    search,
    categoryId,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    page,
    limit,
  };
}

export function toProductsQueryParams(
  params: CatalogFilterParams,
): ProductsQueryParams {
  const query: ProductsQueryParams = {
    page: params.page,
    limit: params.limit,
  };

  if (params.search) {
    query.search = params.search;
  }
  if (params.categoryId !== undefined) {
    query.categoryId = params.categoryId;
  }
  if (params.minPrice !== undefined) {
    query.minPrice = params.minPrice;
  }
  if (params.maxPrice !== undefined) {
    query.maxPrice = params.maxPrice;
  }
  if (params.sortBy) {
    query.sortBy = params.sortBy;
  }
  if (params.sortOrder) {
    query.sortOrder = params.sortOrder;
  }

  return query;
}

/**
 * Stable primitive key for React `cache()` (Object.is on one string).
 * Same filters from generateMetadata and page share one HTTP call.
 */
export function toCatalogCacheKey(params: CatalogFilterParams): string {
  return JSON.stringify(toProductsQueryParams(params));
}

export function buildCatalogQueryString(
  params: Partial<CatalogFilterParams>,
): string {
  const sp = new URLSearchParams();

  if (params.search) {
    sp.set('search', params.search);
  }
  if (params.categoryId !== undefined) {
    sp.set('categoryId', String(params.categoryId));
  }
  if (params.minPrice !== undefined) {
    sp.set('minPrice', String(params.minPrice));
  }
  if (params.maxPrice !== undefined) {
    sp.set('maxPrice', String(params.maxPrice));
  }
  if (params.sortBy && params.sortBy !== DEFAULT_SORT_BY) {
    sp.set('sortBy', params.sortBy);
  }
  if (params.sortOrder && params.sortOrder !== DEFAULT_SORT_ORDER) {
    sp.set('sortOrder', params.sortOrder);
  }
  if (params.limit !== undefined && params.limit !== DEFAULT_LIMIT) {
    sp.set('limit', String(params.limit));
  }
  if (params.page !== undefined && params.page > 1) {
    sp.set('page', String(params.page));
  }

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function createCatalogFilterHref(
  current: CatalogFilterParams,
  changes: Partial<CatalogFilterParams>,
  resetPage = true,
): Route {
  const targetPage = changes.page ?? (resetPage ? 1 : current.page);

  const merged: CatalogFilterParams = {
    ...current,
    ...changes,
    page: targetPage,
  };

  const qs = buildCatalogQueryString(merged);
  return (qs ? `/${qs}` : '/') as Route;
}

