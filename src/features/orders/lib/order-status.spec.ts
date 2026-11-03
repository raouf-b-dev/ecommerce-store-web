import { describe, expect, it } from 'vitest';
import {
  isShopperCancellableStatus,
  SHOPPER_CANCELLABLE_STATUSES,
} from '@/features/orders/lib/order-status';
import type { OrderStatus } from '@/features/orders/types';

const ALL_STATUSES: readonly OrderStatus[] = [
  'pending_payment',
  'payment_failed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

describe('isShopperCancellableStatus', () => {
  it.each([...SHOPPER_CANCELLABLE_STATUSES])(
    'is true for shopper-cancellable status %s',
    (status) => {
      expect(isShopperCancellableStatus(status)).toBe(true);
    },
  );

  it.each(
    ALL_STATUSES.filter(
      (status) =>
        !SHOPPER_CANCELLABLE_STATUSES.some(
          (cancellable) => cancellable === status,
        ),
    ),
  )('is false for non-shopper-cancellable status %s', (status) => {
    expect(isShopperCancellableStatus(status)).toBe(false);
  });
});
