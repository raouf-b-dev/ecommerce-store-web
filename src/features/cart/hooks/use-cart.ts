'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { hasHttpStatus } from '@/lib/api/parse-api-error';
import {
  clearStoredCartId,
  getStoredCartId,
  CART_ID_EVENT,
} from '@/features/cart/lib/cart-storage';
import { getCartRequest } from '@/features/cart/api/cart-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import type { CartItemResponse, CartResponse } from '@/features/cart/types';

function subscribeToCartId(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener(CART_ID_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CART_ID_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function getCartIdSnapshot(): number | null {
  return getStoredCartId();
}

function getServerCartIdSnapshot(): number | null {
  return null;
}

export function useStoredCartId(): number | null {
  return useSyncExternalStore(
    subscribeToCartId,
    getCartIdSnapshot,
    getServerCartIdSnapshot,
  );
}

export type UseCartResult = {
  cart: CartResponse | null;
  cartId: number | null;
  itemCount: number;
  totalAmount: number;
  subtotal: number;
  items: CartItemResponse[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function useCart(): UseCartResult {
  const { isAuthenticated } = useAuth();
  const cartId = useStoredCartId();

  const query = useQuery({
    queryKey: cartId ? cartKeys.detail(cartId) : cartKeys.detail(0),
    queryFn: async () => {
      if (!cartId) {
        return null;
      }
      return getCartRequest(cartId);
    },
    enabled: Boolean(isAuthenticated && cartId),
    staleTime: 45_000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.isError && hasHttpStatus(query.error, 422, 404)) {
      clearStoredCartId();
    }
  }, [query.isError, query.error]);

  const cart: CartResponse | null =
    isAuthenticated && cartId ? (query.data ?? null) : null;
  const items: CartItemResponse[] = cart?.items ?? [];
  const itemCount = cart?.itemCount ?? 0;
  const totalAmount = cart?.totalAmount ?? 0;
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    cart,
    cartId: isAuthenticated ? cartId : null,
    itemCount,
    totalAmount,
    subtotal,
    items,
    isLoading: Boolean(isAuthenticated && cartId && query.isLoading),
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  };
}
