import type { Route } from 'next';
import type { AuthSession } from '@/features/auth/types';
import { safeRedirectPath } from '@/features/auth/lib/safe-redirect-path';

function route(path: string): Route {
  return path as Route;
}

export function getChangePasswordRedirectPath(
  redirect?: string | null,
): Route {
  const destination = safeRedirectPath(redirect);
  return route(
    `/change-password?redirect=${encodeURIComponent(destination)}`,
  );
}

export function getLoginRedirectPath(redirect?: string | null): Route {
  if (!redirect) {
    return '/login';
  }

  const destination = safeRedirectPath(redirect);
  return route(`/login?redirect=${encodeURIComponent(destination)}`);
}

export function getRegisterRedirectPath(
  redirect?: string | null,
): Route {
  if (!redirect) {
    return '/register';
  }

  const destination = safeRedirectPath(redirect);
  return route(`/register?redirect=${encodeURIComponent(destination)}`);
}

export function navigateAfterLoginPath(
  session: AuthSession,
  redirect?: string | null,
): Route {
  if (session.mustChangePassword) {
    return getChangePasswordRedirectPath(redirect);
  }

  return route(safeRedirectPath(redirect));
}
