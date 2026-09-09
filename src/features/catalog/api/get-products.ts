import 'server-only';

import { cache } from 'react';
import { serverClient } from '@/lib/api/server-client';
import {
  ApiRequestError,
  parseApiErrorBody,
  toApiRequestError,
} from '@/lib/api/parse-api-error';
import { toProductsQueryParams } from '@/features/catalog/lib/catalog-params';
import type {
  CatalogFilterParams,
  PaginatedProducts,
  ProductSortBy,
  SortOrder,
} from '@/features/catalog/types';

const FETCH_TIMEOUT_MS = 10000;

/**
 * Internal fetcher cached with React cache().
 * React cache() compares arguments using reference equality (Object.is).
 * By receiving primitive parameters rather than object references, distinct filter objects
 * created separately during SSR (e.g. in generateMetadata and CatalogContent) share
 * the exact same deduplicated request.
 */
const fetchProductsInternal = cache(
  async (
    page: number,
    limit: number,
    categoryId: number | undefined,
    search: string | undefined,
    minPrice: number | undefined,
    maxPrice: number | undefined,
    sortBy: ProductSortBy | undefined,
    sortOrder: SortOrder | undefined,
  ): Promise<PaginatedProducts> => {
    try {
      const { data, error, response } = await serverClient.GET('/v1/products', {
        params: {
          query: toProductsQueryParams({
            page,
            limit,
            categoryId,
            search,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder,
          }),
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw toApiRequestError(
          response,
          parseApiErrorBody(error),
          'Failed to fetch products',
        );
      }

      if (data === undefined || data === null) {
        throw new ApiRequestError({
          statusCode: 500,
          message: 'Malformed product list response',
        });
      }

      return data;
    } catch (error) {
      if (error instanceof ApiRequestError) {
        throw error;
      }
      throw new ApiRequestError({
        statusCode: 503,
        message: 'API unavailable',
      });
    }
  },
);

export async function getProducts(
  params: CatalogFilterParams,
): Promise<PaginatedProducts> {
  return fetchProductsInternal(
    params.page,
    params.limit,
    params.categoryId,
    params.search,
    params.minPrice,
    params.maxPrice,
    params.sortBy,
    params.sortOrder,
  );
}
