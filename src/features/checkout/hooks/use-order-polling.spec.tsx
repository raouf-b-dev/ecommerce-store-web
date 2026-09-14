import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOrderPolling } from './use-order-polling';
import * as ordersApi from '@/features/orders/api/orders-api';
import * as cartStorage from '@/features/cart/lib/cart-storage';
import { createMockOrderDetail } from '@/test/fixtures/orders.fixture';

vi.mock('@/features/orders/api/orders-api', () => ({
  getOrderRequest: vi.fn(),
}));

vi.mock('@/features/cart/lib/cart-storage', () => ({
  clearStoredCartId: vi.fn(),
  getStoredCartId: vi.fn(),
  setStoredCartId: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    },
  };
}

describe('useOrderPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when orderId is not provided', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useOrderPolling(null), {
      wrapper: Wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(ordersApi.getOrderRequest).not.toHaveBeenCalled();
  });

  it('fetches order details and polls when status is pending_payment', async () => {
    const pendingOrder = createMockOrderDetail({
      id: 42,
      orderNumber: 'ORD-2026-0042',
      status: 'pending_payment',
    });

    vi.mocked(ordersApi.getOrderRequest).mockResolvedValue(pendingOrder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useOrderPolling(42), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.order).toBeDefined();
    });

    expect(result.current.order?.status).toBe('pending_payment');
    expect(cartStorage.clearStoredCartId).not.toHaveBeenCalled();
  });

  it('clears stored cart ID and invalidates cart queries when clearCartOnSuccess is true', async () => {
    const confirmedOrder = createMockOrderDetail({
      id: 42,
      orderNumber: 'ORD-2026-0042',
      status: 'confirmed',
    });

    vi.mocked(ordersApi.getOrderRequest).mockResolvedValue(confirmedOrder);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () => useOrderPolling(42, { clearCartOnSuccess: true }),
      {
        wrapper: Wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.order?.status).toBe('confirmed');
    });

    expect(cartStorage.clearStoredCartId).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['cart'] }),
    );
  });

  it('does NOT clear cart ID by default when order reaches confirmed', async () => {
    const confirmedOrder = createMockOrderDetail({
      id: 42,
      orderNumber: 'ORD-2026-0042',
      status: 'confirmed',
    });

    vi.mocked(ordersApi.getOrderRequest).mockResolvedValue(confirmedOrder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useOrderPolling(42), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.order?.status).toBe('confirmed');
    });

    expect(cartStorage.clearStoredCartId).not.toHaveBeenCalled();
  });

  it('does NOT clear cart ID when order reaches payment_failed', async () => {
    const failedOrder = createMockOrderDetail({
      id: 42,
      orderNumber: 'ORD-2026-0042',
      status: 'payment_failed',
    });

    vi.mocked(ordersApi.getOrderRequest).mockResolvedValue(failedOrder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useOrderPolling(42), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.order?.status).toBe('payment_failed');
    });

    expect(cartStorage.clearStoredCartId).not.toHaveBeenCalled();
  });

  it('sets isTimedOut to true after polling timeout elapses', () => {
    vi.useFakeTimers();
    const pendingOrder = createMockOrderDetail({
      id: 42,
      orderNumber: 'ORD-2026-0042',
      status: 'pending_payment',
    });

    vi.mocked(ordersApi.getOrderRequest).mockResolvedValue(pendingOrder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useOrderPolling(42), {
      wrapper: Wrapper,
    });

    expect(result.current.isTimedOut).toBe(false);

    act(() => {
      vi.advanceTimersByTime(60001);
    });

    expect(result.current.isTimedOut).toBe(true);
    vi.useRealTimers();
  });
});
