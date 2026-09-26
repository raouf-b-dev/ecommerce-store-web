'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import {
  QueryListRegion,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { AccountNav } from '@/components/layout/account-nav';
import { OrderDetailItems } from '@/features/orders/components/order-detail-items';
import { OrderPaymentSummary } from '@/features/orders/components/order-payment-summary';
import { useOrderDetail } from '@/features/orders/hooks/use-order-detail';
import { ORDERS_LIST_HREF } from '@/features/orders/lib/order-list-filters';
import { formatDateTime, formatMoney } from '@/lib/format';

type OrderDetailContentProps = {
  orderId: number;
};

export function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const { order, isLoading, isFetching, isError, error, refetch } =
    useOrderDetail(orderId);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return (
      <div className="space-y-6">
        <AccountNav />
        <p className="text-sm text-muted-foreground">
          This order link is invalid. Check the address or return to your{' '}
          <Link href={ORDERS_LIST_HREF} className="font-medium underline underline-offset-4">
            orders
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AccountNav />

      <QueryStateAlert
        isError={isError}
        hasData={Boolean(order)}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        resource="order"
      />

      {isError && !order ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          You may not have access to this order, or it may no longer exist.{' '}
          <Link href={ORDERS_LIST_HREF} className="font-medium underline underline-offset-4">
            Back to orders
          </Link>
        </p>
      ) : null}

      <QueryListRegion
        isLoading={isLoading}
        isFetching={isFetching}
        loadingLabel="Loading order details…"
        hasData={Boolean(order)}
      >
        {order ? (
          <div className="space-y-8">
            <header className="space-y-3 border-b pb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {order.orderNumber}
                </h1>
                <StatusBadge status={order.status} />
              </div>
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <div>
                  <dt className="inline">Placed: </dt>
                  <dd className="inline">{formatDateTime(order.createdAt)}</dd>
                </div>
                <div>
                  <dt className="inline">Updated: </dt>
                  <dd className="inline">{formatDateTime(order.updatedAt)}</dd>
                </div>
              </dl>
            </header>

            <section className="space-y-2" aria-labelledby="shipping-heading">
              <h2
                id="shipping-heading"
                className="text-sm font-semibold tracking-wide text-foreground"
              >
                Shipping address
              </h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {order.shippingAddress}
              </p>
            </section>

            <section className="space-y-3" aria-labelledby="items-heading">
              <h2
                id="items-heading"
                className="text-sm font-semibold tracking-wide text-foreground"
              >
                Items
              </h2>
              <OrderDetailItems items={order.items} currency={order.currency} />
            </section>

            <div className="ml-auto w-full max-w-sm space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatMoney(order.shippingCost, order.currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatMoney(order.totalPrice, order.currency)}</span>
              </div>
            </div>

            <OrderPaymentSummary orderId={order.id} />
          </div>
        ) : null}
      </QueryListRegion>
    </div>
  );
}
