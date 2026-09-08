'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  QueryLoading,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import {
  getChangePasswordRedirectPath,
  navigateAfterLoginPath,
} from '@/features/auth/lib/auth-routes';
import { useAuth } from '@/lib/auth/auth-context';

type RouteProps = {
  children: ReactNode;
};

/**
 * Non-blocking storefront gate. Public server-rendered content remains visible
 * while the optional browser session bootstraps.
 */
export function RequirePasswordChanged({ children }: RouteProps) {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!session?.mustChangePassword) {
      return;
    }

    router.replace(
      getChangePasswordRedirectPath(
        `${window.location.pathname}${window.location.search}`,
      ),
    );
  }, [session, router]);

  return children;
}

export function ChangePasswordRoute({ children }: RouteProps) {
  const { status, session, sessionError, retrySession } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (
      status === 'authenticated' &&
      session &&
      !session.mustChangePassword
    ) {
      router.replace(
        navigateAfterLoginPath(session, searchParams.get('redirect')),
      );
    }
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

  if (
    status === 'unauthenticated' ||
    (status === 'authenticated' && !session?.mustChangePassword)
  ) {
    return <QueryLoading>Redirecting…</QueryLoading>;
  }

  return children;
}
