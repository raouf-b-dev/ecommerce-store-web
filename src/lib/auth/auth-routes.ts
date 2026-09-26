// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { Route } from 'next';
import type { AuthSession } from '@/lib/auth/types';
import { safeRedirectPath } from '@/lib/auth/safe-redirect-path';

export function getChangePasswordRedirectPath(
  redirect?: string | null,
): Route {
  const destination = safeRedirectPath(redirect);
  return `/change-password?redirect=${encodeURIComponent(destination)}`;
}

export function getLoginRedirectPath(redirect?: string | null): Route {
  if (!redirect) {
    return '/login';
  }

  const destination = safeRedirectPath(redirect);
  return `/login?redirect=${encodeURIComponent(destination)}`;
}

export function getRegisterRedirectPath(redirect?: string | null): Route {
  if (!redirect) {
    return '/register';
  }

  const destination = safeRedirectPath(redirect);
  return `/register?redirect=${encodeURIComponent(destination)}`;
}

export function navigateAfterLoginPath(
  session: AuthSession,
  redirect?: string | null,
): Route {
  if (session.mustChangePassword) {
    return getChangePasswordRedirectPath(redirect);
  }

  // Boundary cast: safeRedirectPath sanitizes untrusted runtime input,
  // which Next.js router.push/replace requires as Route.
  return safeRedirectPath(redirect) as Route;
}
