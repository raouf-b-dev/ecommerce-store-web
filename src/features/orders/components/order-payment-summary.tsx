'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import {
  QueryLoading,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import { useOrderPayment } from '@/features/orders/hooks/use-order-payment';
import { formatMoney, formatStatusLabel } from '@/lib/format';

type OrderPaymentSummaryProps = {
  orderId: number;
};

export function OrderPaymentSummary({ orderId }: OrderPaymentSummaryProps) {
  const { payment, isLoading, isError, error, refetch } =
    useOrderPayment(orderId);

  if (isLoading && payment === undefined) {
    return <QueryLoading>Loading payment details…</QueryLoading>;
  }

  return (
    <section className="space-y-3" aria-labelledby="order-payment-heading">
      <h2
        id="order-payment-heading"
        className="text-sm font-semibold tracking-wide text-foreground"
      >
        Payment
      </h2>

      <QueryStateAlert
        isError={isError}
        hasData={payment != null}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        resource="payment details"
      />

      {payment == null && !isError ? (
        <p className="text-sm text-muted-foreground">
          Payment details are not available yet.
        </p>
      ) : null}

      {payment ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium capitalize text-foreground">
              {formatStatusLabel(payment.status)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Method</dt>
            <dd className="font-medium text-foreground">
              {formatStatusLabel(payment.paymentMethod)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Transaction ID</dt>
            <dd className="font-medium break-all text-foreground">
              {payment.transactionId || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-medium text-foreground">
              {formatMoney(payment.amount, payment.currency)}
            </dd>
          </div>
          {payment.failureReason ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Failure reason</dt>
              <dd className="font-medium text-foreground">
                {payment.failureReason}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
