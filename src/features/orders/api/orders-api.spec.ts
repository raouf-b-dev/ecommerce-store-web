// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getOrderPaymentRequest,
  getOrderRequest,
  listOrdersRequest,
} from './orders-api';
import {
  createMockOrderDetail,
  createMockPaginatedOrders,
  createMockPaymentDetail,
} from '@/test/fixtures/orders.fixture';
import {
  createErrorApiResponse,
  createSuccessApiResponse,
} from '@/test/fixtures/api-response.fixture';

const mockClient = vi.hoisted(() => ({
  GET: vi.fn(),
}));

vi.mock('@/lib/api/browser-client', () => ({
  browserClient: mockClient,
}));

describe('orders-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listOrdersRequest', () => {
    it('calls GET /v1/orders with query filters', async () => {
      const data = createMockPaginatedOrders();
      mockClient.GET.mockResolvedValueOnce(createSuccessApiResponse(data));

      const filters = { page: 1, limit: 10, status: 'confirmed' as const };
      const result = await listOrdersRequest(filters);

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/orders', {
        params: { query: filters },
      });
      expect(result).toEqual(data);
    });

    it('throws on error response', async () => {
      mockClient.GET.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Unauthorized' }, 401),
      );

      await expect(
        listOrdersRequest({ page: 1, limit: 10 }),
      ).rejects.toThrow();
    });
  });

  describe('getOrderRequest', () => {
    it('calls GET /v1/orders/{id} and returns order detail', async () => {
      const order = createMockOrderDetail();
      mockClient.GET.mockResolvedValueOnce(createSuccessApiResponse(order));

      const result = await getOrderRequest(123);

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/orders/{id}', {
        params: { path: { id: 123 } },
      });
      expect(result).toEqual(order);
    });

    it('throws on error response', async () => {
      mockClient.GET.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Not found' }, 404),
      );

      await expect(getOrderRequest(999)).rejects.toThrow();
    });
  });

  describe('getOrderPaymentRequest', () => {
    it('returns payment details when present', async () => {
      const payment = createMockPaymentDetail();
      mockClient.GET.mockResolvedValueOnce(createSuccessApiResponse(payment));

      const result = await getOrderPaymentRequest(123);

      expect(mockClient.GET).toHaveBeenCalledWith(
        '/v1/payments/orders/{orderId}',
        {
          params: { path: { orderId: 123 } },
        },
      );
      expect(result).toEqual(payment);
    });

    it('returns null when the API returns empty payment data', async () => {
      mockClient.GET.mockResolvedValueOnce({
        data: null,
        error: undefined,
        response: new Response(null, { status: 200 }),
      });

      await expect(getOrderPaymentRequest(123)).resolves.toBeNull();
    });

    it('throws on error response', async () => {
      mockClient.GET.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Forbidden' }, 403),
      );

      await expect(getOrderPaymentRequest(123)).rejects.toThrow();
    });
  });
});
