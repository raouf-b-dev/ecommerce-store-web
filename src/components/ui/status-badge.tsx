// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import type { components } from '@/lib/api/generated/schema';
import { ORDER_STATUS_LABELS } from '@/features/orders/lib/order-status';

export type OrderStatus =
  components['schemas']['OrderDetailResponseDto']['status'];

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
  {
    variants: {
      status: {
        pending_payment:
          'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50',
        confirmed:
          'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/50',
        processing:
          'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/60 dark:border-blue-700/50',
        shipped:
          'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300/60 dark:border-cyan-700/50',
        delivered:
          'bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-300 border border-green-300/60 dark:border-green-700/50',
        payment_failed:
          'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/60 dark:border-rose-700/50',
        cancelled:
          'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300/60 dark:border-zinc-700/50',
        refunded:
          'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300/60 dark:border-purple-700/50',
      },
    },
    defaultVariants: {
      status: 'pending_payment',
    },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: OrderStatus;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  showDot = true,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      role="status"
      data-slot="status-badge"
      data-status={status}
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            'size-1.5 rounded-full',
            status === 'pending_payment' && 'bg-amber-500 animate-pulse',
            status === 'confirmed' && 'bg-emerald-500',
            status === 'processing' && 'bg-blue-500',
            status === 'shipped' && 'bg-cyan-500',
            status === 'delivered' && 'bg-green-500',
            status === 'payment_failed' && 'bg-rose-500',
            status === 'cancelled' && 'bg-zinc-400',
            status === 'refunded' && 'bg-purple-500',
          )}
          aria-hidden="true"
        />
      )}
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
