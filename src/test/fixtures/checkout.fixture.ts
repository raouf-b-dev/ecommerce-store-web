import { vi } from 'vitest';
import type {
  CheckoutResponseDto,
  OrderDetailResponseDto,
  OrderItemDetailResponseDto,
} from '@/features/checkout/types';
import type { UseOrderPollingResult } from '@/features/checkout/hooks/use-order-polling';
import type { UseCheckoutMutationResult } from '@/features/checkout/hooks/use-checkout-mutation';

export function createMockOrderItemDetail(
  overrides?: Partial<OrderItemDetailResponseDto>,
): OrderItemDetailResponseDto {
  return {
    productId: 10,
    sku: 'CHAIR-01',
    title: 'Ergonomic Desk Chair',
    unitPrice: 200,
    quantity: 1,
    subtotal: 200,
    ...overrides,
  };
}

export function createMockOrderDetail(
  overrides?: Partial<OrderDetailResponseDto>,
): OrderDetailResponseDto {
  const items = overrides?.items ?? [createMockOrderItemDetail()];
  const totalPrice =
    overrides?.totalPrice ??
    items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id: 123,
    orderNumber: 'ORD-2026-0123',
    userId: 1,
    userName: 'Alice Smith',
    userEmail: 'alice@store.local',
    status: 'confirmed',
    shippingAddress: 'Alice Smith, 456 Oak Avenue, San Francisco, CA 94102, US',
    items,
    totalAmount: overrides?.totalAmount ?? totalPrice,
    totalPrice,
    currency: 'USD',
    createdAt: '2026-09-13T12:00:00.000Z',
    updatedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  };
}

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
