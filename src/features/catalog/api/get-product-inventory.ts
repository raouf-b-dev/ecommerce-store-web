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
import type { ProductInventory } from '@/features/catalog/types';

const FETCH_TIMEOUT_MS = 10000;

export const getProductInventory = cache(
  async (productId: number): Promise<ProductInventory | null> => {
    try {
      const { data, error, response } = await serverClient.GET(
        '/v1/inventory/check/{productId}',
        {
          params: { path: { productId } },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        },
      );

      if (!response.ok) {
        throw toApiRequestError(
          response,
          parseApiErrorBody(error),
          'Failed to fetch inventory',
        );
      }

      if (data === undefined) {
        throw new ApiRequestError({
          statusCode: 500,
          message: 'Malformed inventory response',
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
