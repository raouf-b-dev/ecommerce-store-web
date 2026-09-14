import { vi } from 'vitest';
import type { CheckoutResponseDto } from '@/features/checkout/types';
import type { UseOrderPollingResult } from '@/features/checkout/hooks/use-order-polling';
import type { UseCheckoutMutationResult } from '@/features/checkout/hooks/use-checkout-mutation';
import { createMockOrderDetail } from '@/test/fixtures/orders.fixture';

export function createMockCheckoutResponse(
  overrides?: Partial<CheckoutResponseDto>,
): CheckoutResponseDto {
  return {
    orderId: 123,
    jobId: 'job-123',
    status: 'pending_payment',
    message: 'Checkout process started.',
    ...overrides,
  };
}

export function createMockUseOrderPollingResult(
  overrides?: Partial<UseOrderPollingResult>,
): UseOrderPollingResult {
  const order =
    overrides?.order !== undefined
      ? overrides.order
      : createMockOrderDetail({ status: 'confirmed' });

  return {
    order,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    isTimedOut: false,
    handleManualRefetch: vi.fn(),
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockUseCheckoutMutationResult(
  overrides?: Partial<UseCheckoutMutationResult>,
): UseCheckoutMutationResult {
  return {
    mutateAsync: vi.fn().mockResolvedValue(createMockCheckoutResponse()),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  };
}
