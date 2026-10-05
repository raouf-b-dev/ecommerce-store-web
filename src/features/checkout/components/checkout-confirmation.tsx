'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProductImageFrame } from '@/components/media/product-image';
import {
  formatDateTime,
  formatMoney,
  formatShipping,
  formatStatusLabel,
  shippingSentence,
} from '@/lib/format';
import { CATALOG_PATH } from '@/features/catalog/lib/catalog-params';
import { useOrderPolling } from '@/features/checkout/hooks/use-order-polling';
import { TERMINAL_FAILURE_STATUSES } from '@/features/orders/lib/order-status';
import { buildOrderDetailHref } from '@/features/orders/lib/order-list-filters';
import type { OrderStatus } from '@/features/orders/types';

function confirmationHeading(status: OrderStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Your order is confirmed';
    case 'payment_failed':
      return 'Payment failed';
    case 'cancelled':
      return 'Order cancelled';
    case 'refunded':
      return 'Order refunded';
    default:
      return 'Thank you for your order';
  }
}

interface CheckoutConfirmationProps {
  orderId: number;
  onRetry?: () => void;
}

export function CheckoutConfirmation({
  orderId,
  onRetry,
}: CheckoutConfirmationProps) {
  const { order, isLoading, isError, error, isTimedOut, handleManualRefetch } =
    useOrderPolling(orderId, { clearCartOnSuccess: true });

  // 1. Initial Loading Skeleton
  if (isLoading && !order) {
    return (
      <Card className="mx-auto max-w-2xl text-center py-16 border shadow-sm">
        <CardContent className="space-y-4">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <h2 className="text-xl font-semibold text-foreground">
            Processing Order Confirmation…
          </h2>
          <p className="text-sm text-muted-foreground">
            Checking your payment and order status.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 2. Network/API Error
  if (isError && !order) {
    return (
      <Card className="mx-auto max-w-xl border-destructive/50 text-center py-12">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="size-6" />
          </div>
          <CardTitle className="text-xl">Unable to Load Order</CardTitle>
          <CardDescription>
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred while fetching your order details.'}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-4">
          <Button variant="outline" onClick={handleManualRefetch}>
            <RefreshCw className="mr-2 size-4" /> Try Again
          </Button>
          <Button asChild>
            <Link href="/cart">Back to Cart</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!order) {
    return null;
  }

  // 3. Pending Payment (SAGA in flight)
  if (order.status === 'pending_payment') {
    return (
      <Card className="mx-auto max-w-2xl text-center py-12 border shadow-sm">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <div className="size-8 animate-spin rounded-full border-3 border-current border-t-transparent" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Finalizing Your Order
          </CardTitle>
          <div className="flex justify-center">
            <StatusBadge status={order.status} />
          </div>
          <CardDescription className="text-base max-w-md mx-auto pt-2">
            We are confirming payment for order{' '}
            <span className="font-semibold text-foreground">
              {order.orderNumber}
            </span>{' '}
            and reserving your items.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 max-w-md mx-auto">
          {isTimedOut && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-left text-sm text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                Confirmation is taking longer than usual
              </div>
              <p className="text-xs opacity-90">
                Your payment may still be processing in the background. You can
                safely refresh the status below.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={handleManualRefetch}
              >
                <RefreshCw className="mr-2 size-3.5" /> Check Status Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 4. Terminal Failure (payment_failed, cancelled, refunded)
  if (TERMINAL_FAILURE_STATUSES.includes(order.status)) {
    return (
      <Card className="mx-auto max-w-2xl text-center py-12 border-destructive/40 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="size-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            {confirmationHeading(order.status)}
          </CardTitle>
          <div className="flex justify-center">
            <StatusBadge status={order.status} />
          </div>
          <CardDescription className="text-base max-w-md mx-auto pt-2">
            {order.status === 'payment_failed' ? (
              <>
                Order{' '}
                <span className="font-semibold text-foreground">
                  {order.orderNumber}
                </span>{' '}
                could not be finalized. Your items have been preserved in your
                cart.
              </>
            ) : order.status === 'refunded' ? (
              <>
                Order{' '}
                <span className="font-semibold text-foreground">
                  {order.orderNumber}
                </span>{' '}
                has been refunded.
              </>
            ) : (
              <>
                Order{' '}
                <span className="font-semibold text-foreground">
                  {order.orderNumber}
                </span>{' '}
                was cancelled.
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardFooter className="justify-center gap-4 pt-4">
          <Button asChild variant="outline">
            <Link href="/cart">
              <ShoppingBag className="mr-2 size-4" /> Return to Cart
            </Link>
          </Button>
          {onRetry && (
            <Button onClick={onRetry}>
              Try Again <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // 5. Terminal Success (confirmed, processing, shipped, delivered)
  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in-50 duration-300">
      {/* Success banner card */}
      <Card className="border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 text-center py-8 shadow-xs">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {confirmationHeading(order.status)}
          </h2>
          <div className="flex justify-center pt-1">
            <StatusBadge status={order.status} />
          </div>
          <CardDescription className="text-sm pt-1">
            Order{' '}
            <span className="font-semibold text-foreground">
              {order.orderNumber}
            </span>{' '}
            is {formatStatusLabel(order.status)}. Check your account for status
            updates.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Order breakdown */}
      <Card className="border shadow-xs">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">
                Order {order.orderNumber}
              </h2>
              <CardDescription>
                Placed on {formatDateTime(order.createdAt)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <PackageCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {formatStatusLabel(order.status)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Order Items list */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Items Purchased
            </h4>
            <div className="divide-y rounded-lg border">
              {order.items.map((item) => (
                <div
                  key={`${item.productId}-${item.sku}`}
                  className="flex items-center gap-4 p-4 text-sm"
                >
                  <ProductImageFrame
                    src={item.imageUrl}
                    name={item.title}
                    sizes="56px"
                    className="w-14 rounded-md border"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {item.quantity} ×{' '}
                      {formatMoney(item.unitPrice, order.currency)}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatMoney(item.subtotal, order.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping and Totals grid */}
          <div className="grid gap-6 sm:grid-cols-2 pt-2">
            {/* Shipping Address */}
            <div className="rounded-lg border p-4 bg-muted/20">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Shipping Destination
              </h4>
              <p className="font-medium text-sm text-foreground">
                {order.userName}
              </p>
              <p className="text-xs text-muted-foreground whitespace-pre-line">
                {order.shippingAddress}
              </p>
            </div>

            {/* Financial Summary */}
            <div className="rounded-lg border p-4 bg-muted/20 space-y-2 text-sm">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Payment Summary
              </h4>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {formatShipping(order.shippingCost, order.currency)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-base text-foreground">
                <span>Total Paid</span>
                <span>{formatMoney(order.totalPrice, order.currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {shippingSentence(order.shippingCost, order.currency)}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t pt-4">
          <Button asChild variant="outline" size="lg" className="font-medium">
            <Link href={buildOrderDetailHref(order.id)}>
              View Order Details
            </Link>
          </Button>
          <Button asChild size="lg" className="font-medium">
            <Link href={CATALOG_PATH}>
              Continue Shopping <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
