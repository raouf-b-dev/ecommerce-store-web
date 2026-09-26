// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutRequest } from '@/features/checkout/api/checkout-api';
import { orderKeys } from '@/features/orders/hooks/order-keys';
import { getCurrentCartRequest } from '@/features/cart/api/cart-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import { useAuth } from '@/lib/auth/auth-context';
import { getOrCreateInFlightKey } from '@/features/checkout/lib/idempotency';
import type { CheckoutFormValues } from '@/features/checkout/schemas/checkout-schema';
import type {
  CheckoutDto,
  CheckoutResponseDto,
} from '@/features/checkout/types';
import type { CartResponse } from '@/features/cart/types';

export interface UseCheckoutMutationOptions {
  onSuccess?: (data: CheckoutResponseDto) => void;
}

export interface UseCheckoutMutationResult {
  mutateAsync: (values: CheckoutFormValues) => Promise<CheckoutResponseDto>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}

export function useCheckoutMutation(
  options?: UseCheckoutMutationOptions,
): UseCheckoutMutationResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.userId ?? null;

  const mutation = useMutation({
    mutationFn: async (
      values: CheckoutFormValues,
    ): Promise<CheckoutResponseDto> => {
      const cached = queryClient.getQueryData<CartResponse | null>(
        cartKeys.current(userId),
      );
      const cart = cached ?? (await getCurrentCartRequest());
      if (!cart?.id) {
        throw new Error(
          'Your cart is empty or expired. Please add items before checking out.',
        );
      }

      const idempotencyKey = getOrCreateInFlightKey();

      const shippingAddress = values.useDefaultAddress
        ? undefined
        : values.shippingAddress;

      const dto: CheckoutDto = {
        cartId: cart.id,
        paymentMethod: 'STRIPE',
        customerNotes: values.customerNotes?.trim() || undefined,
        shippingAddress,
      };

      return checkoutRequest(dto, idempotencyKey);
    },
    onSuccess: (data) => {
      // Keep Idempotency-Key until terminal order success (polling) or explicit retry.
      queryClient.invalidateQueries({
        queryKey: orderKeys.all,
      });
      router.refresh();
      options?.onSuccess?.(data);
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
