import { vi } from 'vitest';
import type {
  OrderDetailResponseDto,
  OrderItemDetailResponseDto,
  OrderListItemResponseDto,
  PaginatedOrdersResponseDto,
  PaymentDetailResponseDto,
} from '@/features/orders/types';
import type { UseOrdersListResult } from '@/features/orders/hooks/use-orders-list';
import type { UseOrderDetailResult } from '@/features/orders/hooks/use-order-detail';
import type { UseOrderPaymentResult } from '@/features/orders/hooks/use-order-payment';

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

export function createMockOrderListItem(
  overrides?: Partial<OrderListItemResponseDto>,
): OrderListItemResponseDto {
  return {
    id: 123,
    orderNumber: 'ORD-2026-0123',
    userId: 1,
    userName: 'Alice Smith',
    userEmail: 'alice@store.local',
    status: 'confirmed',
    itemCount: 1,
    totalAmount: 200,
    currency: 'USD',
    createdAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  };
}

export function createMockPaginatedOrders(
  overrides?: Partial<PaginatedOrdersResponseDto>,
): PaginatedOrdersResponseDto {
  const items = overrides?.items ?? [createMockOrderListItem()];

  return {
    items,
    total: overrides?.total ?? items.length,
    page: overrides?.page ?? 1,
    limit: overrides?.limit ?? 10,
    totalPages:
      overrides?.totalPages ??
      Math.max(1, Math.ceil((overrides?.total ?? items.length) / (overrides?.limit ?? 10))),
    ...overrides,
  };
}

export function createMockPaymentDetail(
  overrides?: Partial<PaymentDetailResponseDto>,
): PaymentDetailResponseDto {
  return {
    id: 1,
    orderId: 123,
    userId: 1,
    userName: 'Alice Smith',
    userEmail: 'alice@store.local',
    amount: 200,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'stripe',
    transactionId: 'txn_123',
    createdAt: '2026-09-13T12:00:00.000Z',
    updatedAt: '2026-09-13T12:05:00.000Z',
    gatewayPaymentIntentId: 'pi_123',
    failureReason: null,
    metadata: null,
    ...overrides,
  };
}

export function createMockUseOrdersListResult(
  overrides?: Partial<UseOrdersListResult>,
): UseOrdersListResult {
  return {
    data: createMockPaginatedOrders(),
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockUseOrderDetailResult(
  overrides?: Partial<UseOrderDetailResult>,
): UseOrderDetailResult {
  return {
    order: createMockOrderDetail(),
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockUseOrderPaymentResult(
  overrides?: Partial<UseOrderPaymentResult>,
): UseOrderPaymentResult {
  return {
    payment: createMockPaymentDetail(),
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
