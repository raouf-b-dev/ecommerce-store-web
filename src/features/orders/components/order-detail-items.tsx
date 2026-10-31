import { ProductImageFrame } from '@/components/media/product-image';
import { formatMoney, formatOptionalText } from '@/lib/format';
import type { OrderItemDetailResponseDto } from '@/features/orders/types';

type OrderDetailItemsProps = {
  items: OrderItemDetailResponseDto[];
  currency: string;
};

export function OrderDetailItems({ items, currency }: OrderDetailItemsProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This order has no line items.
      </p>
    );
  }

  return (
    <ul className="divide-y" aria-label="Order items">
      {items.map((item) => (
        <li
          key={item.productId}
          className="flex items-start gap-3 py-3 sm:items-center sm:gap-4"
        >
          <ProductImageFrame
            src={item.imageUrl}
            name={item.title}
            sizes="48px"
            className="w-12 shrink-0 rounded-md border"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium text-foreground">{item.title}</p>
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div>
                <dt className="inline">SKU: </dt>
                <dd className="inline">{formatOptionalText(item.sku)}</dd>
              </div>
              <div>
                <dt className="inline">Qty: </dt>
                <dd className="inline">
                  {item.quantity} × {formatMoney(item.unitPrice, currency)}
                </dd>
              </div>
            </dl>
          </div>
          <p className="shrink-0 text-sm font-medium text-foreground tabular-nums">
            {formatMoney(item.subtotal, currency)}
          </p>
        </li>
      ))}
    </ul>
  );
}
