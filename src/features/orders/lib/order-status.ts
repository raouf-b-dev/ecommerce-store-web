// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

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
