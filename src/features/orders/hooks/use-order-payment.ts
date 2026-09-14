'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrderPaymentRequest } from '@/features/orders/api/orders-api';
import { orderKeys } from '@/features/orders/hooks/order-keys';
import type { PaymentDetailResponseDto } from '@/features/orders/types';

export type UseOrderPaymentResult = {
  payment: PaymentDetailResponseDto | null | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function useOrderPayment(
  orderId: number | null | undefined,
): UseOrderPaymentResult {
  const enabled = typeof orderId === 'number' && orderId > 0;

  const query = useQuery({
    queryKey: orderKeys.payment(orderId),
    queryFn: () => getOrderPaymentRequest(orderId!),
    enabled,
  });

  return {
    payment: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: async () => query.refetch(),
  };
}
