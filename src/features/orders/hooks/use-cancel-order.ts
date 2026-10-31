'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { cancelOrderRequest } from '@/features/orders/api/orders-api';
import { orderKeys } from '@/features/orders/hooks/order-keys';
import { hasHttpStatus } from '@/lib/api/parse-api-error';
import type { OrderMutationResponseDto } from '@/features/orders/types';

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (orderId: number): Promise<OrderMutationResponseDto> => {
      try {
        return await cancelOrderRequest(orderId);
      } catch (error) {
        // 409: status no longer cancellable; refresh so the affordance disappears.
        if (hasHttpStatus(error, 409)) {
          await queryClient.invalidateQueries({ queryKey: orderKeys.all });
        }
        throw error;
      }
    },
    onSuccess: async (_data, orderId) => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId),
      });
      await queryClient.invalidateQueries({
        queryKey: orderKeys.payment(orderId),
      });
      router.refresh();
    },
  });
}
