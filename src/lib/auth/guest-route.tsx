'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  QueryLoading,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import { navigateAfterLoginPath } from '@/features/auth/lib/auth-routes';
import { useAuth } from '@/lib/auth/auth-context';

type GuestRouteProps = {
  children: ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const { status, session, sessionError, retrySession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    if (!session) {
      return;
    }

    router.replace(
      navigateAfterLoginPath(session, searchParams.get('redirect')),
    );
  }, [status, session, searchParams, router]);

  if (status === 'loading') {
    return <QueryLoading>Loading session…</QueryLoading>;
  }

  if (status === 'error') {
    return (
      <QueryStateAlert
        isError
        hasData={false}
        error={sessionError}
        onRetry={retrySession}
        resource="session"
      />
    );
  }

  if (status === 'authenticated') {
    return <QueryLoading>Redirecting…</QueryLoading>;
  }

  return children;
}
