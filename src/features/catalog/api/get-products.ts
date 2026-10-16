import 'server-only';

import { cache } from 'react';
import { serverClient } from '@/lib/api/server-client';
import {
  ApiRequestError,
  parseApiErrorBody,
  toApiRequestError,
} from '@/lib/api/parse-api-error';
import {
  parseCatalogSearchParams,
  toCatalogCacheKey,
  toProductsQueryParams,
} from '@/features/catalog/lib/catalog-params';
import type {
  CatalogFilterParams,
  PaginatedProducts,
  ProductsQueryParams,
} from '@/features/catalog/types';

const FETCH_TIMEOUT_MS = 10000;

function productsQueryFromCacheKey(cacheKey: string): ProductsQueryParams {
  const parsed: unknown = JSON.parse(cacheKey);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ApiRequestError({
      statusCode: 500,
      message: 'Malformed product list cache key',
    });
  }

  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined || value === null) {
      continue;
    }
    raw[key] = String(value);
  }

  return toProductsQueryParams(parseCatalogSearchParams(raw));
}

/**
 * Deduplicates identical catalog list requests within one RSC render
 * (e.g. generateMetadata + CatalogContent) via a stable string cache key.
 */
const fetchProductsByCacheKey = cache(
  async (cacheKey: string): Promise<PaginatedProducts> => {
    try {
      const query = productsQueryFromCacheKey(cacheKey);

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
      throw new ApiRequestError(
        { statusCode: 503, message: 'API unavailable' },
        { cause: error },
      );
    }
  },
);

export async function getProducts(
  params: CatalogFilterParams,
): Promise<PaginatedProducts> {
  return fetchProductsByCacheKey(toCatalogCacheKey(params));
}
