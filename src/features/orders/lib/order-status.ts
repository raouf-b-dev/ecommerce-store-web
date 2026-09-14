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

export function isTerminalStatus(status: OrderStatus): boolean {
  return (
    TERMINAL_SUCCESS_STATUSES.includes(status) ||
    TERMINAL_FAILURE_STATUSES.includes(status)
  );
}

export function isSuccessStatus(status: OrderStatus): boolean {
  return TERMINAL_SUCCESS_STATUSES.includes(status);
}
