'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import {
  QueryListRegion,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import { useCart } from '@/features/cart/hooks/use-cart';
import { CartItemRow } from '@/features/cart/components/cart-item-row';
import { CartSummary } from '@/features/cart/components/cart-summary';
import { CartEmptyState } from '@/features/cart/components/cart-empty-state';

export function CartContent() {
  const {
    cart,
    items,
    itemCount,
    lineItemCount,
    subtotal,
    totalAmount,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useCart();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Shopping Cart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your selected items and manage quantities.
          </p>
        </div>
        {lineItemCount > 0 ? (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {lineItemCount} {lineItemCount === 1 ? 'item' : 'items'}
          </span>
        ) : null}
      </div>

      <QueryStateAlert
        isError={isError}
        hasData={Boolean(cart)}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        resource="shopping cart"
      />

      <QueryListRegion
        isLoading={isLoading}
        isFetching={isFetching}
        loadingLabel="Loading your shopping cart…"
        hasData={Boolean(cart)}
      >
        {items.length === 0 ? (
          <CartEmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <ul className="divide-y border-t" aria-label="Cart items">
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </ul>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-6">
                {cart?.currency ? (
                  <CartSummary
                    subtotal={subtotal}
                    totalAmount={totalAmount}
                    currency={cart.currency}
                    itemCount={itemCount}
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </QueryListRegion>

      {!isLoading && !cart && !isError ? <CartEmptyState /> : null}
    </div>
  );
}
