'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { hasHttpStatus } from '@/lib/api/parse-api-error';
import {
  addItemToCartRequest,
  clearCartRequest,
  createCartRequest,
  getCurrentCartRequest,
  removeCartItemRequest,
  updateCartItemRequest,
} from '@/features/cart/api/cart-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import { useAuth } from '@/lib/auth/auth-context';
import type { CartResponse } from '@/features/cart/types';

async function resolveCartId(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
): Promise<number | null> {
  const cached = queryClient.getQueryData<CartResponse | null>(
    cartKeys.current(userId),
  );
  if (cached?.id) {
    return cached.id;
  }

  const current = await getCurrentCartRequest();
  queryClient.setQueryData(cartKeys.current(userId), current);
  return current?.id ?? null;
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.userId ?? null;

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: number;
      quantity: number;
    }) => {
      let cartId = await resolveCartId(queryClient, userId);

      if (!cartId) {
        const created = await createCartRequest();
        cartId = created.id;
        queryClient.setQueryData(cartKeys.current(userId), created);
      }

      try {
        await addItemToCartRequest(cartId, { productId, quantity });
      } catch (error) {
        if (hasHttpStatus(error, 422, 404)) {
          const freshCart = await createCartRequest();
          cartId = freshCart.id;
          queryClient.setQueryData(cartKeys.current(userId), freshCart);
          await addItemToCartRequest(cartId, { productId, quantity });
        } else {
          throw error;
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      router.refresh();
    },
  });
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.userId ?? null;

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: number;
      quantity: number;
    }) => {
      const cartId = await resolveCartId(queryClient, userId);
      if (!cartId) {
        throw new Error('No active cart found');
      }

      try {
        await updateCartItemRequest(cartId, itemId, { quantity });
      } catch (error) {
        if (hasHttpStatus(error, 422, 404)) {
          await queryClient.invalidateQueries({ queryKey: cartKeys.all });
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      router.refresh();
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.userId ?? null;

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: number }) => {
      const cartId = await resolveCartId(queryClient, userId);
      if (!cartId) {
        throw new Error('No active cart found');
      }

      try {
        await removeCartItemRequest(cartId, itemId);
      } catch (error) {
        if (hasHttpStatus(error, 400, 422, 404)) {
          await queryClient.invalidateQueries({ queryKey: cartKeys.all });
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      router.refresh();
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.userId ?? null;

  return useMutation({
    mutationFn: async () => {
      const cartId = await resolveCartId(queryClient, userId);
      if (!cartId) {
        return;
      }

      try {
        await clearCartRequest(cartId);
      } catch (error) {
        if (hasHttpStatus(error, 422, 404)) {
          await queryClient.invalidateQueries({ queryKey: cartKeys.all });
        }
        throw error;
      }
    },
    onSuccess: async () => {
      queryClient.setQueryData(cartKeys.current(userId), null);
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      router.refresh();
    },
  });
}
