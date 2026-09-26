'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

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

  return <CheckoutForm onOrderCreated={persistOrderId} />;
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
