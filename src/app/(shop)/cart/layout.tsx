import type { ReactNode } from 'react';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { QueryLoading } from '@/components/feedback/query-state';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { NO_INDEX_ROBOTS } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  robots: NO_INDEX_ROBOTS,
};

// ProtectedRoute must finish browser-only cookie bootstrap before cart UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

export default function CartLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<QueryLoading>Loading cart…</QueryLoading>}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </Suspense>
  );
}
