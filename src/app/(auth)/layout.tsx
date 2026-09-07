import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { AuthChrome } from '@/components/layout/auth-chrome';
import { QueryLoading } from '@/components/feedback/query-state';
import { GuestRoute } from '@/lib/auth/guest-route';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthChrome>
      <Suspense fallback={<QueryLoading>Loading session…</QueryLoading>}>
        <GuestRoute>{children}</GuestRoute>
      </Suspense>
    </AuthChrome>
  );
}
