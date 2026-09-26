'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from '@tanstack/react-query';
import { getOrderRequest } from '@/features/orders/api/orders-api';
import { orderKeys } from '@/features/orders/hooks/order-keys';
import type { OrderDetailResponseDto } from '@/features/orders/types';

export type UseOrderDetailResult = {
  order: OrderDetailResponseDto | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function useOrderDetail(
  id: number | null | undefined,
): UseOrderDetailResult {
  const enabled = typeof id === 'number' && id > 0;

  const query = useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrderRequest(id!),
    enabled,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: async () => query.refetch(),
  };
}
