'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueryLoading } from '@/components/feedback/query-state';
import { renewInFlightKey } from '@/features/checkout/lib/idempotency';
import { CheckoutForm } from './checkout-form';
import { CheckoutConfirmation } from './checkout-confirmation';

function CheckoutContentInner() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const initialOrderId = orderIdParam ? Number(orderIdParam) : null;

  const [activeOrderId, setActiveOrderId] = useState<number | null>(
    initialOrderId && Number.isInteger(initialOrderId) && initialOrderId > 0
      ? initialOrderId
      : null,
  );

  if (activeOrderId) {
    return (
      <CheckoutConfirmation
        orderId={activeOrderId}
        onRetry={() => {
          renewInFlightKey();
          setActiveOrderId(null);
        }}
      />
    );
  }

  return <CheckoutForm onOrderCreated={(id) => setActiveOrderId(id)} />;
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
