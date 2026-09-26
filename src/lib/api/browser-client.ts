// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import 'client-only';

import createClient from 'openapi-fetch';
import { API_BASE_URL } from '@/lib/api/api-base-url';
import type { paths } from '@/lib/api/generated/schema';
import {
  ensureFreshAccessToken,
  silentRefreshAccessToken,
} from '@/lib/api/silent-refresh';
import { clearAccessToken } from '@/lib/auth/auth-session';
import {
  getChangePasswordRedirectPath,
  getLoginRedirectPath,
} from '@/lib/auth/auth-routes';

export const browserClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  credentials: 'include',
});

const retryRequests = new WeakMap<Request, Request>();

export function cacheRequestForRetry(request: Request): void {
  retryRequests.set(request, request.clone());
}

function isAuthenticationPath(pathname: string): boolean {
  return pathname.includes('/authentication/');
}

function isSilentRefreshExemptPath(pathname: string): boolean {
  return (
    pathname.includes('/authentication/login') ||
    pathname.includes('/authentication/register') ||
    pathname.includes('/authentication/refresh')
  );
}

export function shouldRedirectToChangePassword(
  status: number,
  pathname: string,
  body: { code?: string; message?: string } | null,
): boolean {
  if (status !== 403 || isAuthenticationPath(pathname) || !body) {
    return false;
  }

  return body.code === 'MUST_CHANGE_PASSWORD';
}

function redirectToChangePassword(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname !== '/change-password') {
    const currentPath =
      `${window.location.pathname}${window.location.search}` +
      window.location.hash;
    window.location.assign(getChangePasswordRedirectPath(currentPath));
  }
}

export function redirectToLogin(): void {
  clearAccessToken();

  if (typeof window === 'undefined') {
    return;
  }

  const redirectTarget =
    `${window.location.pathname}${window.location.search}` +
    window.location.hash;
  const loginUrl = getLoginRedirectPath(redirectTarget);

  if (window.location.pathname !== '/login') {
    window.location.assign(loginUrl);
  }
}

export async function attachAccessToken(request: Request): Promise<void> {
  const url = new URL(request.url);
  if (isSilentRefreshExemptPath(url.pathname)) {
    return;
  }
  if (
    (url.pathname.includes('/authentication/logout') ||
      url.pathname.includes('/authentication/change-password')) &&
    request.headers.has('Authorization')
  ) {
    return;
  }

  const token = await ensureFreshAccessToken();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
}

/**
 * One-shot silent refresh + single retry for a domain 401.
 * Replays a clone captured before fetch so POST bodies are not consumed.
 * Transient refresh failures throw so the shopper is not bounced to login.
 */
export async function recoverFromDomain401(
  request: Request,
): Promise<Response | null> {
  const accessToken = await silentRefreshAccessToken();
  if (!accessToken) {
    redirectToLogin();
    return null;
  }

  const replaySource = retryRequests.get(request) ?? request;
  const retryHeaders = new Headers(replaySource.headers);
  retryHeaders.set('Authorization', `Bearer ${accessToken}`);

  const retryResponse = await fetch(
    new Request(replaySource, {
      headers: retryHeaders,
    }),
  );

  if (retryResponse.status === 401) {
    redirectToLogin();
    return null;
  }

  return retryResponse;
}

browserClient.use({
  async onRequest({ request }) {
    await attachAccessToken(request);
    cacheRequestForRetry(request);
  },
  async onResponse({ response, request }) {
    if (response.status === 403) {
      const url = new URL(request.url);
      if (!isAuthenticationPath(url.pathname)) {
        try {
          const clone = response.clone();
          const body = (await clone.json()) as {
            code?: string;
            message?: string;
          };
          if (
            shouldRedirectToChangePassword(response.status, url.pathname, body)
          ) {
            redirectToChangePassword();
            return;
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    if (response.status !== 401) {
      return;
    }

    const url = new URL(request.url);
    if (isAuthenticationPath(url.pathname)) {
      return;
    }

    const recovered = await recoverFromDomain401(request);
    if (recovered) {
      return recovered;
    }
  },
});
