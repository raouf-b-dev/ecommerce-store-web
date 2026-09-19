'use client';

import { Suspense, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  QueryLoading,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import {
  getChangePasswordRedirectPath,
  getLoginRedirectPath,
  navigateAfterLoginPath,
} from '@/lib/auth/auth-routes';
import { useAuth } from '@/lib/auth/auth-context';

type RouteProps = {
  children: ReactNode;
};

function PasswordChangeWatcher() {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!session?.mustChangePassword) {
      return;
    }

    const search = searchParams.toString();
    const currentPath = `${pathname}${search ? `?${search}` : ''}`;
    router.replace(getChangePasswordRedirectPath(currentPath));
  }, [session, router, pathname, searchParams]);

  return null;
}

/**
 * Non-blocking storefront gate. Public server-rendered content remains visible
 * while the optional browser session bootstraps. The watcher is isolated in a leaf
 * Suspense boundary so useSearchParams() does not block static prerendering of children.
 */
export function RequirePasswordChanged({ children }: RouteProps) {
  return (
    <>
      <Suspense fallback={null}>
        <PasswordChangeWatcher />
      </Suspense>
      {children}
    </>
  );
}

export function ChangePasswordRoute({ children }: RouteProps) {
  const { status, session, sessionError, retrySession } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(getLoginRedirectPath(searchParams.get('redirect')));
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
