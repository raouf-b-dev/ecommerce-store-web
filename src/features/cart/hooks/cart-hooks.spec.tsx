// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCart } from './use-cart';
import {
  useAddToCart,
  useUpdateCartItemQuantity,
  useRemoveCartItem,
  useClearCart,
} from './use-cart-mutations';
import * as cartApi from '@/features/cart/api/cart-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import type { CartResponse } from '@/features/cart/types';

const mockUseAuth = vi.fn();
const mockRouterRefresh = vi.fn();

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));

vi.mock('@/features/cart/api/cart-api', () => ({
  createCartRequest: vi.fn(),
  getCurrentCartRequest: vi.fn(),
  getCartRequest: vi.fn(),
  addItemToCartRequest: vi.fn(),
  updateCartItemRequest: vi.fn(),
  removeCartItemRequest: vi.fn(),
  clearCartRequest: vi.fn(),
}));

const emptyCart: CartResponse = {
  id: 55,
  subtotal: 0,
  shippingCost: 0,
  totalAmount: 0,
  itemCount: 0,
  currency: null,
  createdAt: '2026-09-11T00:00:00Z',
  updatedAt: '2026-09-11T00:00:00Z',
  items: [],
};

const mockUserId = '42';

function createWrapper(seedCart?: CartResponse | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  if (seedCart !== undefined) {
    queryClient.setQueryData(cartKeys.current(mockUserId), seedCart);
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('Cart hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated',
      session: { userId: mockUserId },
    });
  });

  describe('useCart', () => {
    it('returns empty cart state when unauthenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      expect(result.current.cart).toBeNull();
      expect(result.current.cartId).toBeNull();
      expect(result.current.itemCount).toBe(0);
      expect(result.current.lineItemCount).toBe(0);
      expect(result.current.totalAmount).toBe(0);
      expect(cartApi.getCurrentCartRequest).not.toHaveBeenCalled();
    });

    it('treats 404 / null current cart as empty without error', async () => {
      vi.mocked(cartApi.getCurrentCartRequest).mockResolvedValue(null);

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cart).toBeNull();
      expect(result.current.isError).toBe(false);
      expect(cartApi.getCurrentCartRequest).toHaveBeenCalled();
    });

    it('loads current cart when authenticated', async () => {
      vi.mocked(cartApi.getCurrentCartRequest).mockResolvedValue({
        id: 42,
        subtotal: 5000,
        shippingCost: 0,
        totalAmount: 5000,
        itemCount: 2,
        currency: 'USD',
        createdAt: '2026-09-11T00:00:00Z',
        updatedAt: '2026-09-11T00:00:00Z',
        items: [
          {
            id: 1,
            productId: 101,
            productName: 'Product 1',
            price: 2500,
            currency: 'USD',
            quantity: 2,
            subtotal: 5000,
            imageUrl: null,
          },
        ],
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cart?.id).toBe(42);
      expect(result.current.itemCount).toBe(2);
      expect(result.current.lineItemCount).toBe(1);
      expect(result.current.totalAmount).toBe(5000);
      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('useAddToCart', () => {
    it('creates a new cart if none exists and adds item', async () => {
      vi.mocked(cartApi.getCurrentCartRequest).mockResolvedValue(null);
      vi.mocked(cartApi.createCartRequest).mockResolvedValue(emptyCart);
      vi.mocked(cartApi.addItemToCartRequest).mockResolvedValue();

      const { result } = renderHook(() => useAddToCart(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ productId: 101, quantity: 2 });
      });

      expect(cartApi.createCartRequest).toHaveBeenCalledTimes(1);
      expect(cartApi.addItemToCartRequest).toHaveBeenCalledWith(55, {
        productId: 101,
        quantity: 2,
      });
      expect(mockRouterRefresh).toHaveBeenCalled();
    });

    it('uses cached current cart without creating', async () => {
      vi.mocked(cartApi.addItemToCartRequest).mockResolvedValue();

      const { result } = renderHook(() => useAddToCart(), {
        wrapper: createWrapper({ ...emptyCart, id: 77 }),
      });

      await act(async () => {
        await result.current.mutateAsync({ productId: 102, quantity: 1 });
      });

      expect(cartApi.createCartRequest).not.toHaveBeenCalled();
      expect(cartApi.addItemToCartRequest).toHaveBeenCalledWith(77, {
        productId: 102,
        quantity: 1,
      });
    });

    it('retries once with a fresh cart when addItem encounters a stale 422', async () => {
      vi.mocked(cartApi.addItemToCartRequest)
        .mockRejectedValueOnce(
          new ApiRequestError({
            statusCode: 422,
            message: 'Cart not active',
          }),
        )
        .mockResolvedValueOnce();

      vi.mocked(cartApi.createCartRequest).mockResolvedValue({
        ...emptyCart,
        id: 99,
      });

      const { result } = renderHook(() => useAddToCart(), {
        wrapper: createWrapper({ ...emptyCart, id: 88 }),
      });

      await act(async () => {
        await result.current.mutateAsync({ productId: 103, quantity: 1 });
      });

      expect(cartApi.createCartRequest).toHaveBeenCalledTimes(1);
      expect(cartApi.addItemToCartRequest).toHaveBeenCalledTimes(2);
      expect(cartApi.addItemToCartRequest).toHaveBeenNthCalledWith(1, 88, {
        productId: 103,
        quantity: 1,
      });
      expect(cartApi.addItemToCartRequest).toHaveBeenNthCalledWith(2, 99, {
        productId: 103,
        quantity: 1,
      });
    });
  });

  describe('useUpdateCartItemQuantity', () => {
    it('updates item quantity and calls router.refresh', async () => {
      vi.mocked(cartApi.updateCartItemRequest).mockResolvedValue();

      const { result } = renderHook(() => useUpdateCartItemQuantity(), {
        wrapper: createWrapper({ ...emptyCart, id: 12 }),
      });

      await act(async () => {
        await result.current.mutateAsync({ itemId: 1, quantity: 5 });
      });

      expect(cartApi.updateCartItemRequest).toHaveBeenCalledWith(12, 1, {
        quantity: 5,
      });
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  describe('useRemoveCartItem', () => {
    it('removes item and calls router.refresh', async () => {
      vi.mocked(cartApi.removeCartItemRequest).mockResolvedValue();

      const { result } = renderHook(() => useRemoveCartItem(), {
        wrapper: createWrapper({ ...emptyCart, id: 12 }),
      });

      await act(async () => {
        await result.current.mutateAsync({ itemId: 1 });
      });

      expect(cartApi.removeCartItemRequest).toHaveBeenCalledWith(12, 1);
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  describe('useClearCart', () => {
    it('clears cart and calls router.refresh', async () => {
      vi.mocked(cartApi.clearCartRequest).mockResolvedValue();

      const { result } = renderHook(() => useClearCart(), {
        wrapper: createWrapper({ ...emptyCart, id: 12 }),
      });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(cartApi.clearCartRequest).toHaveBeenCalledWith(12);
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });
});
