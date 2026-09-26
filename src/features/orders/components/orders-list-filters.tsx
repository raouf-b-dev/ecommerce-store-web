// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Form from 'next/form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_LIMIT,
  ORDER_STATUS_OPTIONS,
  ORDERS_LIST_HREF,
  SORT_BY_OPTIONS,
  SORT_ORDER_OPTIONS,
} from '@/features/orders/lib/order-list-filters';
import type { ShopperOrderListQuery } from '@/features/orders/types';

type OrdersListFiltersProps = {
  filters: ShopperOrderListQuery;
};

const selectClassName =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30';

export function OrdersListFilters({ filters }: OrdersListFiltersProps) {
  return (
    <Form
      action={ORDERS_LIST_HREF}
      className="flex flex-col gap-3 rounded-xl border bg-card/60 p-4 shadow-xs backdrop-blur-xs"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="orders-status"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Status
          </label>
          <select
            id="orders-status"
            name="status"
            defaultValue={filters.status ?? ''}
            className={selectClassName}
          >
            <option value="" className="bg-background text-foreground">
              All
            </option>
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-background text-foreground"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="orders-sort-by"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Sort by
          </label>
          <select
            id="orders-sort-by"
            name="sortBy"
            defaultValue={filters.sortBy ?? ''}
            className={selectClassName}
          >
            <option value="" className="bg-background text-foreground">
              Default
            </option>
            {SORT_BY_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-background text-foreground"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="orders-sort-order"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Order
          </label>
          <select
            id="orders-sort-order"
            name="sortOrder"
            defaultValue={filters.sortOrder ?? ''}
            className={selectClassName}
          >
            <option value="" className="bg-background text-foreground">
              Default
            </option>
            {SORT_ORDER_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-background text-foreground"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="orders-limit"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Per page
          </label>
          <select
            id="orders-limit"
            name="limit"
            defaultValue={String(filters.limit ?? DEFAULT_LIMIT)}
            className={selectClassName}
          >
            {[10, 20, 50].map((limit) => (
              <option
                key={limit}
                value={limit}
                className="bg-background text-foreground"
              >
                {limit}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href={ORDERS_LIST_HREF}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear
        </Link>
        <Button type="submit" size="sm" className="h-9 px-4">
          Apply filters
        </Button>
      </div>
    </Form>
  );
}
