// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { QueryLoading } from '@/components/feedback/query-state';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { NO_INDEX_ROBOTS } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: NO_INDEX_ROBOTS,
};

// ProtectedRoute must finish browser-only cookie bootstrap before checkout UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<QueryLoading>Loading checkout…</QueryLoading>}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </Suspense>
  );
}
