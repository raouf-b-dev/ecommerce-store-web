'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listOrdersRequest } from '@/features/orders/api/orders-api';
import { orderKeys } from '@/features/orders/hooks/order-keys';
import type {
  PaginatedOrdersResponseDto,
  ShopperOrderListQuery,
} from '@/features/orders/types';

export type UseOrdersListResult = {
  data: PaginatedOrdersResponseDto | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function useOrdersList(
  filters: ShopperOrderListQuery,
): UseOrdersListResult {
  const query = useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => listOrdersRequest(filters),
    staleTime: 45_000,
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: async () => query.refetch(),
  };
}
