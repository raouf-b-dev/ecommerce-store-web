import 'server-only';

import { cache } from 'react';
import { serverClient } from '@/lib/api/server-client';
import {
  ApiRequestError,
  parseApiErrorBody,
  toApiRequestError,
} from '@/lib/api/parse-api-error';
import { toCatalogCacheKey } from '@/features/catalog/lib/catalog-params';
import type {
  CatalogFilterParams,
  PaginatedProducts,
  ProductsQueryParams,
} from '@/features/catalog/types';

const FETCH_TIMEOUT_MS = 10000;

/**
 * Deduplicates identical catalog list requests within one RSC render
 * (e.g. generateMetadata + CatalogContent) via a stable string cache key.
 */
const fetchProductsByCacheKey = cache(
  async (cacheKey: string): Promise<PaginatedProducts> => {
    const query = JSON.parse(cacheKey) as ProductsQueryParams;

    try {
      const { data, error, response } = await serverClient.GET('/v1/products', {
        params: { query },
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
  return fetchProductsByCacheKey(toCatalogCacheKey(params));
}
