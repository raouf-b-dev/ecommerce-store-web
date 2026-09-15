import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addItemToCartRequest,
  clearCartRequest,
  createCartRequest,
  getCartRequest,
  getCurrentCartRequest,
  removeCartItemRequest,
  updateCartItemRequest,
} from './cart-api';
import type { CartResponse } from '@/features/cart/types';

const mockClient = vi.hoisted(() => ({
  POST: vi.fn(),
  GET: vi.fn(),
  PATCH: vi.fn(),
  DELETE: vi.fn(),
}));

vi.mock('@/lib/api/browser-client', () => ({
  browserClient: mockClient,
}));

describe('cart-api', () => {
  const sampleCart: CartResponse = {
    id: 1,
    userId: 10,
    items: [
      {
        id: 100,
        productId: 5,
        productName: 'Mechanical Keyboard',
        price: 89.99,
        currency: 'USD',
        quantity: 2,
        subtotal: 179.98,
        imageUrl: 'https://example.com/keyboard.jpg',
      },
    ],
    itemCount: 2,
    totalAmount: 179.98,
    currency: 'USD',
    createdAt: '2025-10-31T10:00:00Z',
    updatedAt: '2025-10-31T12:30:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCartRequest', () => {
    it('calls POST /v1/carts and returns cart data on success', async () => {
      mockClient.POST.mockResolvedValueOnce({
        data: sampleCart,
        error: undefined,
        response: new Response(JSON.stringify(sampleCart), { status: 201 }),
      });

      const result = await createCartRequest();

      expect(mockClient.POST).toHaveBeenCalledWith('/v1/carts');
      expect(result).toEqual(sampleCart);
    });

    it('throws ApiRequestError on failure', async () => {
      mockClient.POST.mockResolvedValueOnce({
        data: undefined,
        error: { message: 'Unauthorized' },
        response: new Response(null, { status: 401 }),
      });

      await expect(createCartRequest()).rejects.toThrow();
    });
  });

  describe('getCurrentCartRequest', () => {
    it('calls GET /v1/carts/current and returns cart data on success', async () => {
      mockClient.GET.mockResolvedValueOnce({
        data: sampleCart,
        error: undefined,
        response: new Response(JSON.stringify(sampleCart), { status: 200 }),
      });

      const result = await getCurrentCartRequest();

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/carts/current');
      expect(result).toEqual(sampleCart);
    });

    it('returns null on 404 (no cart yet)', async () => {
      mockClient.GET.mockResolvedValueOnce({
        data: undefined,
        error: { message: 'Not found' },
        response: new Response(null, { status: 404 }),
      });

      await expect(getCurrentCartRequest()).resolves.toBeNull();
    });
  });

  describe('getCartRequest', () => {
    it('calls GET /v1/carts/{id} with correct path param', async () => {
      mockClient.GET.mockResolvedValueOnce({
        data: sampleCart,
        error: undefined,
        response: new Response(JSON.stringify(sampleCart), { status: 200 }),
      });

      const result = await getCartRequest(1);

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/carts/{id}', {
        params: { path: { id: 1 } },
      });
      expect(result).toEqual(sampleCart);
    });

    it('throws ApiRequestError when cart is not found', async () => {
      mockClient.GET.mockResolvedValueOnce({
        data: undefined,
        error: { message: 'Cart not found' },
        response: new Response(null, { status: 422 }),
      });

      await expect(getCartRequest(99)).rejects.toThrow();
    });
  });

  describe('addItemToCartRequest', () => {
    it('calls POST /v1/carts/{id}/items with path and body', async () => {
      mockClient.POST.mockResolvedValueOnce({
        data: undefined,
        error: undefined,
        response: new Response(null, { status: 204 }),
      });

      await addItemToCartRequest(1, { productId: 5, quantity: 2 });

      expect(mockClient.POST).toHaveBeenCalledWith('/v1/carts/{id}/items', {
        params: { path: { id: 1 } },
        body: { productId: 5, quantity: 2 },
      });
    });

    it('throws on insufficient stock error', async () => {
      mockClient.POST.mockResolvedValueOnce({
        data: undefined,
        error: { message: 'Insufficient stock' },
        response: new Response(null, { status: 422 }),
      });

      await expect(
        addItemToCartRequest(1, { productId: 5, quantity: 999 }),
      ).rejects.toThrow();
    });
  });

  describe('updateCartItemRequest', () => {
    it('calls PATCH /v1/carts/{id}/items/{itemId}', async () => {
      mockClient.PATCH.mockResolvedValueOnce({
        data: undefined,
        error: undefined,
        response: new Response(null, { status: 204 }),
      });

      await updateCartItemRequest(1, 100, { quantity: 3 });

      expect(mockClient.PATCH).toHaveBeenCalledWith(
        '/v1/carts/{id}/items/{itemId}',
        {
          params: { path: { id: 1, itemId: 100 } },
          body: { quantity: 3 },
        },
      );
    });
  });

  describe('removeCartItemRequest', () => {
    it('calls DELETE /v1/carts/{id}/items/{itemId}', async () => {
      mockClient.DELETE.mockResolvedValueOnce({
        data: undefined,
        error: undefined,
        response: new Response(null, { status: 204 }),
      });

      await removeCartItemRequest(1, 100);

      expect(mockClient.DELETE).toHaveBeenCalledWith(
        '/v1/carts/{id}/items/{itemId}',
        {
          params: { path: { id: 1, itemId: 100 } },
        },
      );
    });
  });

  describe('clearCartRequest', () => {
    it('calls DELETE /v1/carts/{id}', async () => {
      mockClient.DELETE.mockResolvedValueOnce({
        data: undefined,
        error: undefined,
        response: new Response(null, { status: 204 }),
      });

      await clearCartRequest(1);

      expect(mockClient.DELETE).toHaveBeenCalledWith('/v1/carts/{id}', {
        params: { path: { id: 1 } },
      });
    });
  });
});
