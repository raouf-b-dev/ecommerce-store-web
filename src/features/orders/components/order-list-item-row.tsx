// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime, formatMoney } from '@/lib/format';
import { buildOrderDetailHref } from '@/features/orders/lib/order-list-filters';
import type { OrderListItemResponseDto } from '@/features/orders/types';

type OrderListItemRowProps = {
  order: OrderListItemResponseDto;
};

export function OrderListItemRow({ order }: OrderListItemRowProps) {
  return (
    <li>
      <Link
        href={buildOrderDetailHref(order.id)}
        className="flex flex-col gap-2 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-baseline gap-3 text-sm sm:flex-col sm:items-end sm:gap-1">
          <span className="font-semibold text-foreground">
            {formatMoney(order.totalAmount, order.currency)}
          </span>
          <span className="text-muted-foreground">
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </Link>
    </li>
  );
}
