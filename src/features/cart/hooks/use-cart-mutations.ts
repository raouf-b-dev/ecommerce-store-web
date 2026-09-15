'use client';

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
import type { CartResponse } from '@/features/cart/types';

async function resolveCartId(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<number | null> {
  const cached = queryClient.getQueryData<CartResponse | null>(
    cartKeys.current(),
  );
  if (cached?.id) {
    return cached.id;
  }

  const current = await getCurrentCartRequest();
  queryClient.setQueryData(cartKeys.current(), current);
  return current?.id ?? null;
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: number;
      quantity: number;
    }) => {
      let cartId = await resolveCartId(queryClient);

      if (!cartId) {
        const created = await createCartRequest();
        cartId = created.id;
        queryClient.setQueryData(cartKeys.current(), created);
      }

      try {
        await addItemToCartRequest(cartId, { productId, quantity });
      } catch (error) {
        if (hasHttpStatus(error, 422, 404)) {
          const freshCart = await createCartRequest();
          cartId = freshCart.id;
          queryClient.setQueryData(cartKeys.current(), freshCart);
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

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: number;
      quantity: number;
    }) => {
      const cartId = await resolveCartId(queryClient);
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

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: number }) => {
      const cartId = await resolveCartId(queryClient);
      if (!cartId) {
        throw new Error('No active cart found');
      }

      try {
        await removeCartItemRequest(cartId, itemId);
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

export function useClearCart() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const cartId = await resolveCartId(queryClient);
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
      queryClient.setQueryData(cartKeys.current(), null);
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      router.refresh();
    },
  });
}
