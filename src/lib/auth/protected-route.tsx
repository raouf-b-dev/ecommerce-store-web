'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  QueryLoading,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import {
  getChangePasswordRedirectPath,
  getLoginRedirectPath,
} from '@/features/auth/lib/auth-routes';
import { useAuth } from '@/lib/auth/auth-context';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status, mustChangePassword, sessionError, retrySession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      status !== 'unauthenticated' &&
      !(status === 'authenticated' && mustChangePassword)
    ) {
      return;
    }

    const search = searchParams.toString();
    const redirect = `${pathname}${search ? `?${search}` : ''}`;
    const destination =
      status === 'unauthenticated'
        ? getLoginRedirectPath(redirect)
        : getChangePasswordRedirectPath(redirect);
    router.replace(destination);
  }, [status, mustChangePassword, pathname, searchParams, router]);

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

  if (
    status === 'unauthenticated' ||
    (status === 'authenticated' && mustChangePassword)
  ) {
    return <QueryLoading>Redirecting…</QueryLoading>;
  }

  return children;
}
