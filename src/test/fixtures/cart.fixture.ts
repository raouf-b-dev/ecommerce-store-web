// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { vi } from 'vitest';
import type { CartItemResponse, CartResponse } from '@/features/cart/types';
import type { UseCartResult } from '@/features/cart/hooks/use-cart';

export function createMockCartItem(
  overrides?: Partial<CartItemResponse>,
): CartItemResponse {
  return {
    id: 10,
    productId: 100,
    productName: 'Mechanical Keyboard',
    price: 150,
    currency: 'USD',
    quantity: 1,
    subtotal: 150,
    imageUrl: null,
    ...overrides,
  };
}

export function createMockCart(
  overrides?: Partial<CartResponse>,
): CartResponse {
  const items = overrides?.items ?? [createMockCartItem()];
  const itemCount =
    overrides?.itemCount ??
    items.reduce((total, item) => total + item.quantity, 0);
  const subtotal =
    overrides?.subtotal ??
    items.reduce((total, item) => total + item.subtotal, 0);
  const shippingCost = overrides?.shippingCost ?? 0;
  const totalAmount =
    overrides?.totalAmount ?? Number((subtotal + shippingCost).toFixed(2));

  return {
    id: 1,
    userId: 1,
    items,
    itemCount,
    subtotal,
    shippingCost,
    totalAmount,
    currency: 'USD',
    createdAt: '2026-09-13T12:00:00.000Z',
    updatedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  };
}

export function createMockUseCartResult(
  overrides?: Partial<UseCartResult>,
): UseCartResult {
  const cart =
    overrides?.cart !== undefined
      ? overrides.cart
      : createMockCart(overrides?.items ? { items: overrides.items } : undefined);

  return {
    cart,
    cartId: cart?.id ?? null,
    itemCount: overrides?.itemCount ?? cart?.itemCount ?? 0,
    lineItemCount:
      overrides?.lineItemCount ??
      overrides?.items?.length ??
      cart?.items?.length ??
      0,
    totalAmount: overrides?.totalAmount ?? cart?.totalAmount ?? 0,
    subtotal: overrides?.subtotal ?? cart?.subtotal ?? 0,
    shippingCost: overrides?.shippingCost ?? cart?.shippingCost ?? 0,
    items: overrides?.items ?? cart?.items ?? [],
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
