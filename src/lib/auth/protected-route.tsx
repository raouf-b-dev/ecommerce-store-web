'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import {
  QueryLoading,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import { useAuth } from '@/lib/auth/auth-context';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status, sessionError, retrySession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== 'unauthenticated') {
      return;
    }

    const search = searchParams.toString();
    const redirect = `${pathname}${search ? `?${search}` : ''}`;
    router.replace(`/login?redirect=${encodeURIComponent(redirect)}` as Route);
  }, [status, pathname, searchParams, router]);

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

  if (status === 'unauthenticated') {
    return <QueryLoading>Redirecting…</QueryLoading>;
  }

  return children;
}
