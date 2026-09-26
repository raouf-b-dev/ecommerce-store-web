// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { formatMoney } from '@/lib/format';
import type { OrderItemDetailResponseDto } from '@/features/orders/types';

type OrderDetailItemsProps = {
  items: OrderItemDetailResponseDto[];
  currency: string;
};

export function OrderDetailItems({ items, currency }: OrderDetailItemsProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">This order has no line items.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead>
          <tr className="border-b text-xs font-medium text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Item</th>
            <th className="py-2 pr-4 font-medium">SKU</th>
            <th className="py-2 pr-4 font-medium">Qty × price</th>
            <th className="py-2 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={`${item.productId}-${item.sku}`}>
              <td className="py-3 pr-4 font-medium text-foreground">
                {item.title}
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{item.sku}</td>
              <td className="py-3 pr-4 text-muted-foreground">
                {item.quantity} × {formatMoney(item.unitPrice, currency)}
              </td>
              <td className="py-3 text-right font-medium text-foreground">
                {formatMoney(item.subtotal, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
