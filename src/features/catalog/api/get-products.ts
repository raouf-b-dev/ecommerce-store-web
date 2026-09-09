import 'server-only';

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
} from '@/features/catalog/types';

const FETCH_TIMEOUT_MS = 10000;

export async function getProducts(
  params: CatalogFilterParams,
): Promise<PaginatedProducts> {
  try {
    const { data, error, response } = await serverClient.GET('/v1/products', {
      params: { query: toProductsQueryParams(params) },
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
}
