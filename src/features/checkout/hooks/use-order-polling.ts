import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderRequest } from '@/features/orders/api/orders-api';
import { orderKeys } from '@/features/orders/hooks/order-keys';
import {
  isSuccessStatus,
  isTerminalStatus,
} from '@/features/orders/lib/order-status';
import type { OrderDetailResponseDto } from '@/features/orders/types';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import { clearStoredCartId } from '@/features/cart/lib/cart-storage';

export const POLLING_INTERVAL_MS = 2000;
export const POLLING_TIMEOUT_MS = 60000;

export interface UseOrderPollingResult {
  order: OrderDetailResponseDto | null | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  isTimedOut: boolean;
  handleManualRefetch: () => void;
  refetch: () => Promise<unknown>;
}

export interface UseOrderPollingOptions {
  clearCartOnSuccess?: boolean;
}

export function useOrderPolling(
  orderId: number | null | undefined,
  options?: UseOrderPollingOptions,
): UseOrderPollingResult {
  const { clearCartOnSuccess = false } = options ?? {};
  const queryClient = useQueryClient();
  const [timedOutOrderId, setTimedOutOrderId] = useState<number | null>(null);
  const cartClearedRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    cartClearedRef.current = false;
    startTimeRef.current = orderId ? Date.now() : null;
  }, [orderId]);

  const isTimedOut = Boolean(orderId && timedOutOrderId === orderId);

  const query = useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderRequest(orderId!),
    enabled: Boolean(orderId),
    refetchInterval: (q) => {
      if (isTimedOut) {
        return false;
      }

      const order = q.state.data;
      if (!order) {
        return POLLING_INTERVAL_MS;
      }

      if (isTerminalStatus(order.status)) {
        return false;
      }

      return POLLING_INTERVAL_MS;
    },
  });

  const order = query.data;
  const orderStatus = order?.status;

  useEffect(() => {
    if (
      !orderId ||
      isTimedOut ||
      (orderStatus && isTerminalStatus(orderStatus))
    ) {
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, POLLING_TIMEOUT_MS - elapsed);

    const timer = setTimeout(() => {
      setTimedOutOrderId(orderId);
    }, remaining);

    return () => clearTimeout(timer);
  }, [orderId, isTimedOut, orderStatus]);

  useEffect(() => {
    if (
      clearCartOnSuccess &&
      orderStatus &&
      isSuccessStatus(orderStatus) &&
      !cartClearedRef.current
    ) {
      cartClearedRef.current = true;
      clearStoredCartId();
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    }
  }, [clearCartOnSuccess, orderStatus, queryClient]);

  const handleManualRefetch = () => {
    startTimeRef.current = Date.now();
    setTimedOutOrderId(null);
    query.refetch();
  };

  return {
    order,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isTimedOut,
    handleManualRefetch,
    refetch: async () => query.refetch(),
  };
}
