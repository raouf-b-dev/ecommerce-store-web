import 'server-only';

import { serverClient } from '@/lib/api/server-client';
import { CATALOG_FETCH_TIMEOUT_MS } from '@/features/catalog/api/catalog-constants';
import type { ProductDetail } from '@/features/catalog/types';

export type ProductVisibilityResult =
  | { status: 'active'; product: ProductDetail }
  | { status: 'not_found' }
  | { status: 'inactive' }
  | { status: 'rate_limited'; retryAfter: string | null }
  | { status: 'server_error'; statusCode: number }
  | { status: 'timeout' }
  | { status: 'network_error' };

/**
 * Validates product existence and visibility before response streaming.
 * Uses the shared serverClient and OpenAPI types with a 10s catalog timeout.
 */
export async function validateProductVisibility(
  id: number,
): Promise<ProductVisibilityResult> {
  try {
    const { data, response } = await serverClient.GET('/v1/products/{id}', {
      params: { path: { id } },
      signal: AbortSignal.timeout(CATALOG_FETCH_TIMEOUT_MS),
      cache: 'no-store',
    });

    if (response.status === 404) {
      return { status: 'not_found' };
    }

    if (response.status === 429) {
      return {
        status: 'rate_limited',
        retryAfter: response.headers.get('retry-after'),
      };
    }

    if (!response.ok) {
      return {
        status: 'server_error',
        statusCode: response.status,
      };
    }

    // Malformed 200 payload check: data must be a non-null object with matching numeric ID
    if (!data || typeof data !== 'object' || data.id !== id) {
      return {
        status: 'server_error',
        statusCode: 502,
      };
    }

    if (!data.isActive) {
      return { status: 'inactive' };
    }

    return { status: 'active', product: data };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return { status: 'timeout' };
    }

    // Network connection failures (TypeError in fetch)
    if (error instanceof TypeError) {
      return { status: 'network_error' };
    }

    // Malformed JSON parsing or unexpected thrown errors
    return {
      status: 'server_error',
      statusCode: 500,
    };
  }
}
