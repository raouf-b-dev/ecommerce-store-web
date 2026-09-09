import 'server-only';

import { cache } from 'react';
import { serverClient } from '@/lib/api/server-client';
import {
  ApiRequestError,
  parseApiErrorBody,
  toApiRequestError,
} from '@/lib/api/parse-api-error';
import type { ProductDetail } from '@/features/catalog/types';

const FETCH_TIMEOUT_MS = 10000;

export const getProduct = cache(
  async (id: number): Promise<ProductDetail | null> => {
    try {
      const { data, error, response } = await serverClient.GET(
        '/v1/products/{id}',
        {
          params: { path: { id } },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        },
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw toApiRequestError(
          response,
          parseApiErrorBody(error),
          'Failed to fetch product',
        );
      }

      if (data === undefined || data === null) {
        throw new ApiRequestError({
          statusCode: 500,
          message: 'Malformed product detail response',
        });
      }

      if (!data.isActive) {
        return null;
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
