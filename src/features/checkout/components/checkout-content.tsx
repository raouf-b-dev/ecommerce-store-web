'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QueryLoading } from '@/components/feedback/query-state';
import { renewInFlightKey } from '@/features/checkout/lib/idempotency';
import { CheckoutForm } from './checkout-form';
import { CheckoutConfirmation } from './checkout-confirmation';

function CheckoutContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const initialOrderId = orderIdParam ? Number(orderIdParam) : null;

  const [activeOrderId, setActiveOrderId] = useState<number | null>(
    initialOrderId && Number.isInteger(initialOrderId) && initialOrderId > 0
      ? initialOrderId
      : null,
  );

  function persistOrderId(orderId: number) {
    setActiveOrderId(orderId);
    router.replace(`/checkout?orderId=${orderId}`);
  }

  function clearOrderIdForRetry() {
    renewInFlightKey();
    setActiveOrderId(null);
    router.replace('/checkout');
  }

  if (activeOrderId) {
    return (
      <CheckoutConfirmation
        orderId={activeOrderId}
        onRetry={clearOrderIdForRetry}
      />
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your order with secure payment and address confirmation.
        </p>
      </div>
      <CheckoutForm onOrderCreated={persistOrderId} />
    </>
  );
}

export function CheckoutContent() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl text-center py-16 space-y-4">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <QueryLoading>Loading checkout…</QueryLoading>
        </div>
      }
    >
      <CheckoutContentInner />
    </Suspense>
  );
}
