// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import 'server-only';

import { cache } from 'react';
import { serverClient } from '@/lib/api/server-client';
import {
  ApiRequestError,
  parseApiErrorBody,
  toApiRequestError,
} from '@/lib/api/parse-api-error';
import type { ProductDetail } from '@/features/catalog/types';
import { CATALOG_FETCH_TIMEOUT_MS } from '@/features/catalog/api/catalog-constants';

export const getProduct = cache(
  async (id: number): Promise<ProductDetail | null> => {
    try {
      const { data, error, response } = await serverClient.GET(
        '/v1/products/{id}',
        {
          params: { path: { id } },
          signal: AbortSignal.timeout(CATALOG_FETCH_TIMEOUT_MS),
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
