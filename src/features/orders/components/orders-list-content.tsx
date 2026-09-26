'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import {
  QueryListRegion,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import { AccountNav } from '@/components/layout/account-nav';
import { OrderListItemRow } from '@/features/orders/components/order-list-item-row';
import { OrdersListFilters } from '@/features/orders/components/orders-list-filters';
import { useOrdersList } from '@/features/orders/hooks/use-orders-list';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import {
  ORDERS_LIST_HREF,
  buildOrderListHref,
  hasActiveOrderListFilters,
} from '@/features/orders/lib/order-list-filters';
import type { ShopperOrderListQuery } from '@/features/orders/types';

type OrdersListContentProps = {
  filters: ShopperOrderListQuery;
};

export function OrdersListContent({ filters }: OrdersListContentProps) {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useOrdersList(filters);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.page ?? filters.page ?? 1;

  return (
    <div className="space-y-6">
      <AccountNav />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your order history and track status.
        </p>
      </div>

      <OrdersListFilters filters={filters} />

      <QueryStateAlert
        isError={isError}
        hasData={Boolean(data)}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        resource="orders"
      />

      <QueryListRegion
        isLoading={isLoading}
        isFetching={isFetching}
        loadingLabel="Loading your orders…"
        hasData={Boolean(data)}
      >
        {items.length === 0 ? (
          hasActiveOrderListFilters(filters) ? (
            <EmptyState
              title="No orders match these filters"
              description="Try changing status, dates, or amount filters, or clear filters to see your full order history."
            >
              <Button asChild variant="outline" size="sm">
                <Link href={ORDERS_LIST_HREF}>Clear filters</Link>
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              title="No orders yet"
              description="When you place an order, it will show up here. Start shopping to make your first purchase."
            >
              <Button asChild size="sm">
                <Link href="/">Shop the catalog</Link>
              </Button>
            </EmptyState>
          )
        ) : (
          <div className="space-y-4">
            <ul className="divide-y border-t" aria-label="Orders">
              {items.map((order) => (
                <OrderListItemRow key={order.id} order={order} />
              ))}
            </ul>

            {totalPages > 1 ? (
              <nav
                aria-label="Orders pagination"
                className="flex items-center justify-between gap-3 border-t pt-4"
              >
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={buildOrderListHref({
                        ...filters,
                        page: currentPage - 1,
                      })}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      Previous
                    </Link>
                  ) : null}
                  {currentPage < totalPages ? (
                    <Link
                      href={buildOrderListHref({
                        ...filters,
                        page: currentPage + 1,
                      })}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </div>
        )}
      </QueryListRegion>
    </div>
  );
}
