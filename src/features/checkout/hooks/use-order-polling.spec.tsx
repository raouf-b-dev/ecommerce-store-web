import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOrderPolling } from './use-order-polling';
import * as ordersApi from '@/features/orders/api/orders-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import { createMockOrderDetail } from '@/test/fixtures/orders.fixture';

const mockUserId = '99';

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    session: { userId: mockUserId },
  }),
}));

vi.mock('@/features/orders/api/orders-api', () => ({
  getOrderRequest: vi.fn(),
}));

vi.mock('@/features/checkout/lib/idempotency', () => ({
  clearInFlightKey: vi.fn(),
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
  });

  it('clears current cart query when clearCartOnSuccess is true', async () => {
    const confirmedOrder = createMockOrderDetail({
      id: 42,
      orderNumber: 'ORD-2026-0042',
      status: 'confirmed',
    });

    vi.mocked(ordersApi.getOrderRequest).mockResolvedValue(confirmedOrder);

    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(cartKeys.current(mockUserId), { id: 9, items: [] });

    renderHook(() => useOrderPolling(42, { clearCartOnSuccess: true }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(cartKeys.current(mockUserId))).toBeNull();
    });
  });

  it('does not clear cart when clearCartOnSuccess is false', async () => {
    const confirmedOrder = createMockOrderDetail({
      id: 42,
      status: 'confirmed',
    });

    vi.mocked(ordersApi.getOrderRequest).mockResolvedValue(confirmedOrder);

    const { Wrapper, queryClient } = createWrapper();
    const cart = { id: 9, items: [] };
    queryClient.setQueryData(cartKeys.current(mockUserId), cart);

    renderHook(() => useOrderPolling(42, { clearCartOnSuccess: false }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(ordersApi.getOrderRequest).toHaveBeenCalled();
    });

    expect(queryClient.getQueryData(cartKeys.current(mockUserId))).toEqual(cart);
  });

  it('does not clear cart on terminal failure', async () => {
    const failedOrder = createMockOrderDetail({
      id: 42,
      status: 'payment_failed',
    });

    vi.mocked(ordersApi.getOrderRequest).mockResolvedValue(failedOrder);

    const { Wrapper, queryClient } = createWrapper();
    const cart = { id: 9, items: [] };
    queryClient.setQueryData(cartKeys.current(mockUserId), cart);

    renderHook(() => useOrderPolling(42, { clearCartOnSuccess: true }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(ordersApi.getOrderRequest).toHaveBeenCalled();
    });

    expect(queryClient.getQueryData(cartKeys.current(mockUserId))).toEqual(cart);
  });
});
