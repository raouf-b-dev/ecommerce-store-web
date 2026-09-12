'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { hasHttpStatus } from '@/lib/api/parse-api-error';
import {
  clearStoredCartId,
  getStoredCartId,
  setStoredCartId,
} from '@/features/cart/lib/cart-storage';
import {
  addItemToCartRequest,
  clearCartRequest,
  createCartRequest,
  removeCartItemRequest,
  updateCartItemRequest,
} from '@/features/cart/api/cart-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';

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
      let cartId = getStoredCartId();

      if (!cartId) {
        const created = await createCartRequest();
        cartId = created.id;
        setStoredCartId(cartId);
      }

      try {
        await addItemToCartRequest(cartId, { productId, quantity });
      } catch (error) {
        if (hasHttpStatus(error, 422, 404)) {
          clearStoredCartId();
          const freshCart = await createCartRequest();
          cartId = freshCart.id;
          setStoredCartId(cartId);
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
      const cartId = getStoredCartId();
      if (!cartId) {
        throw new Error('No active cart found');
      }

      try {
        await updateCartItemRequest(cartId, itemId, { quantity });
      } catch (error) {
        if (hasHttpStatus(error, 422, 404)) {
          clearStoredCartId();
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
      const cartId = getStoredCartId();
      if (!cartId) {
        throw new Error('No active cart found');
      }

      try {
        await removeCartItemRequest(cartId, itemId);
      } catch (error) {
        if (hasHttpStatus(error, 422, 404)) {
          clearStoredCartId();
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
      const cartId = getStoredCartId();
      if (!cartId) {
        return;
      }

      try {
        await clearCartRequest(cartId);
      } catch (error) {
        if (hasHttpStatus(error, 422, 404)) {
          clearStoredCartId();
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
