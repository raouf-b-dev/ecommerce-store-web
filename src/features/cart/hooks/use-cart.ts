'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { getCurrentCartRequest } from '@/features/cart/api/cart-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import type { CartItemResponse, CartResponse } from '@/features/cart/types';

export type UseCartResult = {
  cart: CartResponse | null;
  cartId: number | null;
  /** Total units across all line items (API itemCount). */
  itemCount: number;
  /** Unique products / line items in the cart. */
  lineItemCount: number;
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
  const { isAuthenticated, session } = useAuth();
  const userId = session?.userId ?? null;

  const query = useQuery({
    queryKey: cartKeys.current(userId),
    queryFn: getCurrentCartRequest,
    enabled: isAuthenticated,
    staleTime: 45_000,
    placeholderData: keepPreviousData,
  });

  const cart: CartResponse | null = isAuthenticated ? (query.data ?? null) : null;
  const items: CartItemResponse[] = cart?.items ?? [];
  const itemCount = cart?.itemCount ?? 0;
  const lineItemCount = items.length;
  const subtotal = cart?.subtotal ?? 0;
  const shippingCost = cart?.shippingCost ?? 0;
  const totalAmount = cart?.totalAmount ?? 0;

  return {
    cart,
    cartId: cart?.id ?? null,
    itemCount,
    lineItemCount,
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
