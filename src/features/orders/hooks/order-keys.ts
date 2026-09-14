import type { ShopperOrderListQuery } from '@/features/orders/types';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: ShopperOrderListQuery) =>
    [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number | null | undefined) =>
    [...orderKeys.details(), id] as const,
  payments: () => [...orderKeys.all, 'payment'] as const,
  payment: (orderId: number | null | undefined) =>
    [...orderKeys.payments(), orderId] as const,
};
