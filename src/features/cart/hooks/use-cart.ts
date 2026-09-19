'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { getCurrentCartRequest } from '@/features/cart/api/cart-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import type { CartItemResponse, CartResponse } from '@/features/cart/types';

export type UseCartResult = {
  cart: CartResponse | null;
  cartId: number | null;
  itemCount: number;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  items: CartItemResponse[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function useCart(): UseCartResult {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: cartKeys.current(),
    queryFn: getCurrentCartRequest,
    enabled: isAuthenticated,
    staleTime: 45_000,
    placeholderData: keepPreviousData,
  });

  const cart: CartResponse | null = isAuthenticated ? (query.data ?? null) : null;
  const items: CartItemResponse[] = cart?.items ?? [];
  const itemCount = cart?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const shippingCost = cart?.shippingCost ?? 0;
  const totalAmount = cart?.totalAmount ?? 0;

  return {
    cart,
    cartId: cart?.id ?? null,
    itemCount,
    totalAmount,
    subtotal,
    shippingCost,
    items,
    isLoading: Boolean(isAuthenticated && query.isLoading),
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  };
}
