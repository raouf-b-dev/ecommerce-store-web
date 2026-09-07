'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import {
  QueryLoading,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import { safeRedirectPath } from '@/features/auth/lib/safe-redirect-path';
import { useAuth } from '@/lib/auth/auth-context';

type GuestRouteProps = {
  children: ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const { status, sessionError, retrySession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const redirect = safeRedirectPath(searchParams.get('redirect'));
    router.replace(redirect as Route);
  }, [status, searchParams, router]);

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
