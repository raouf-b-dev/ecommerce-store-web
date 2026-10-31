import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelOrderRequest,
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
  PATCH: vi.fn(),
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

  describe('cancelOrderRequest', () => {
    it('calls PATCH /v1/orders/{id}/cancel and returns the mutation DTO', async () => {
      const mutation = {
        id: 123,
        status: 'cancelled' as const,
        totalPrice: 200,
        currency: 'USD',
        updatedAt: '2026-10-31T12:00:00.000Z',
      };
      mockClient.PATCH.mockResolvedValueOnce(createSuccessApiResponse(mutation));

      const result = await cancelOrderRequest(123);

      expect(mockClient.PATCH).toHaveBeenCalledWith('/v1/orders/{id}/cancel', {
        params: { path: { id: 123 } },
      });
      expect(result).toEqual(mutation);
    });

    it('throws an ApiRequestError with the API status on 409', async () => {
      mockClient.PATCH.mockResolvedValueOnce(
        createErrorApiResponse(
          {
            statusCode: 409,
            message: 'Order cannot be cancelled in current state',
            code: 'DOMAIN_ERROR',
          },
          409,
        ),
      );

      await expect(cancelOrderRequest(123)).rejects.toMatchObject({
        name: 'ApiRequestError',
        statusCode: 409,
        code: 'DOMAIN_ERROR',
      });
    });

    it('throws an ApiRequestError on 401 unauthenticated', async () => {
      mockClient.PATCH.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Unauthorized' }, 401),
      );

      await expect(cancelOrderRequest(123)).rejects.toMatchObject({
        name: 'ApiRequestError',
        statusCode: 401,
      });
    });
  });
});
