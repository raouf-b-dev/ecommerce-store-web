import 'server-only';

import { serverClient } from '@/lib/api/server-client';
import {
  ApiRequestError,
  parseApiErrorBody,
  toApiRequestError,
} from '@/lib/api/parse-api-error';
import type { Category } from '@/features/catalog/types';

const FETCH_TIMEOUT_MS = 10000;

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error, response } = await serverClient.GET(
      '/v1/categories',
      {
        params: { query: { isActive: true } },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      throw toApiRequestError(
        response,
        parseApiErrorBody(error),
        'Failed to fetch categories',
      );
    }

    if (!Array.isArray(data)) {
      throw new ApiRequestError({
        statusCode: 500,
        message: 'Malformed category response',
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
