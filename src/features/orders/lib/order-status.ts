import type { OrderStatus } from '@/features/orders/types';

export const TERMINAL_SUCCESS_STATUSES: readonly OrderStatus[] = [
  'confirmed',
  'processing',
  'shipped',
  'delivered',
] as const;

export const TERMINAL_FAILURE_STATUSES: readonly OrderStatus[] = [
  'payment_failed',
  'cancelled',
  'refunded',
] as const;

/**
 * Statuses a shopper (cancel_own_orders, no manage_orders) may cancel.
 * Mirrors OpenAPI PATCH /v1/orders/{id}/cancel: PENDING_PAYMENT, PAYMENT_FAILED,
 * or CONFIRMED. PROCESSING is staff/system only; the API enforces the rest.
 */
export const SHOPPER_CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  'pending_payment',
  'payment_failed',
  'confirmed',
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  payment_failed: 'Payment Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function isTerminalStatus(status: OrderStatus): boolean {
  return (
    TERMINAL_SUCCESS_STATUSES.includes(status) ||
    TERMINAL_FAILURE_STATUSES.includes(status)
  );
}

export function isSuccessStatus(status: OrderStatus): boolean {
  return TERMINAL_SUCCESS_STATUSES.includes(status);
}

export function isShopperCancellableStatus(status: OrderStatus): boolean {
  return SHOPPER_CANCELLABLE_STATUSES.some(
    (cancellable) => cancellable === status,
  );
}
