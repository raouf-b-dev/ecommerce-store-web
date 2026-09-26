// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { browserClient } from '@/lib/api/browser-client';
import { throwApiErrorFromResponse } from '@/lib/api/throw-api-error';
import type {
  OrderDetailResponseDto,
  PaginatedOrdersResponseDto,
  PaymentDetailResponseDto,
  ShopperOrderListQuery,
} from '@/features/orders/types';

export async function listOrdersRequest(
  filters: ShopperOrderListQuery,
): Promise<PaginatedOrdersResponseDto> {
  const { data, error, response } = await browserClient.GET('/v1/orders', {
    params: {
      query: filters,
    },
  });

  if (error || !data || !response.ok) {
    return await throwApiErrorFromResponse(
      response,
      'Failed to load orders.',
      error,
    );
  }

  return data;
}

export async function getOrderRequest(
  orderId: number,
): Promise<OrderDetailResponseDto> {
  const { data, error, response } = await browserClient.GET('/v1/orders/{id}', {
    params: {
      path: { id: orderId },
    },
  });

  if (error || !data || !response.ok) {
    return await throwApiErrorFromResponse(
      response,
      'Failed to load order details.',
      error,
    );
  }

  return data;
}

export async function getOrderPaymentRequest(
  orderId: number,
): Promise<PaymentDetailResponseDto | null> {
  const { data, error, response } = await browserClient.GET(
    '/v1/payments/orders/{orderId}',
    {
      params: {
        path: { orderId },
      },
    },
  );

  if (error || !response.ok) {
    return await throwApiErrorFromResponse(
      response,
      'Failed to load order payment.',
      error,
    );
  }

  return data ?? null;
}
