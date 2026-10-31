import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { useRouter } from 'next/navigation';
import { cancelOrderRequest } from '@/features/orders/api/orders-api';
import { orderKeys } from '@/features/orders/hooks/order-keys';
import { useCancelOrder } from '@/features/orders/hooks/use-cancel-order';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import { createMockOrderDetail } from '@/test/fixtures/orders.fixture';

vi.mock('@/features/orders/api/orders-api');

const refresh = vi.hoisted(
  () => vi.fn<ReturnType<typeof useRouter>['refresh']>(),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(orderKeys.detail(123), createMockOrderDetail());
  queryClient.setQueryData(orderKeys.lists(), { items: [] });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('useCancelOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates order queries and refreshes after a successful cancel', async () => {
    vi.mocked(cancelOrderRequest).mockResolvedValue({
      id: 123,
      status: 'cancelled',
      totalPrice: 200,
      currency: 'USD',
      updatedAt: '2026-10-31T12:00:00.000Z',
    });
    const { queryClient, wrapper } = setup();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCancelOrder(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(123);
    });

    expect(cancelOrderRequest).toHaveBeenCalledWith(123);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: orderKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: orderKeys.detail(123),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: orderKeys.payment(123),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh when the cancel request fails', async () => {
    vi.mocked(cancelOrderRequest).mockRejectedValue(new Error('boom'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useCancelOrder(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(123).catch(() => undefined);
    });

    expect(refresh).not.toHaveBeenCalled();
  });

  it('invalidates order queries on 409 without refreshing the router', async () => {
    vi.mocked(cancelOrderRequest).mockRejectedValue(
      new ApiRequestError({
        statusCode: 409,
        message: 'Order cannot be cancelled in current state',
        code: 'DOMAIN_ERROR',
      }),
    );
    const { queryClient, wrapper } = setup();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCancelOrder(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(123).catch(() => undefined);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: orderKeys.all });
    expect(refresh).not.toHaveBeenCalled();
  });
});
