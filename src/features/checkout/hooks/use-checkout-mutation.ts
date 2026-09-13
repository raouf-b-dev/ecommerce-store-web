import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutRequest } from '@/features/checkout/api/checkout-api';
import { checkoutKeys } from '@/features/checkout/hooks/checkout-keys';
import { getStoredCartId } from '@/features/cart/lib/cart-storage';
import {
  clearInFlightKey,
  getOrCreateInFlightKey,
} from '@/features/checkout/lib/idempotency';
import type { CheckoutFormValues } from '@/features/checkout/schemas/checkout-schema';
import type {
  CheckoutDto,
  CheckoutResponseDto,
} from '@/features/checkout/types';

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

  const mutation = useMutation({
    mutationFn: async (
      values: CheckoutFormValues,
    ): Promise<CheckoutResponseDto> => {
      const cartId = getStoredCartId();
      if (!cartId) {
        throw new Error(
          'Your cart is empty or expired. Please add items before checking out.',
        );
      }

      const idempotencyKey = getOrCreateInFlightKey();

      const shippingAddress = values.useDefaultAddress
        ? undefined
        : values.shippingAddress;

      const dto: CheckoutDto = {
        cartId,
        paymentMethod: 'STRIPE',
        customerNotes: values.customerNotes?.trim() || undefined,
        shippingAddress,
      };

      return checkoutRequest(dto, idempotencyKey);
    },
    onSuccess: (data) => {
      clearInFlightKey();
      queryClient.invalidateQueries({
        queryKey: checkoutKeys.detail(data.orderId),
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
