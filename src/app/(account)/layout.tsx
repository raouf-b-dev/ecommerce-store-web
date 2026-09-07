import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { StorefrontChrome } from '@/components/layout/storefront-chrome';
import { QueryLoading } from '@/components/feedback/query-state';
import { ProtectedRoute } from '@/lib/auth/protected-route';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <StorefrontChrome>
      <Suspense fallback={<QueryLoading>Loading session…</QueryLoading>}>
        <ProtectedRoute>{children}</ProtectedRoute>
      </Suspense>
    </StorefrontChrome>
  );
}
