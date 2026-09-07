import 'client-only';

import { API_BASE_URL } from '@/lib/api/api-base-url';
import { throwApiErrorFromResponse } from '@/lib/api/throw-api-error';
import { isAccessTokenUsable } from '@/lib/auth/access-token';
import { parseAuthTokensPayload } from '@/lib/auth/parse-auth-tokens';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth/auth-session';

export type SilentRefreshResult = {
  accessToken: string;
  permissions: string[];
  mustChangePassword: boolean;
};

type SessionRefreshListener = (result: SilentRefreshResult) => void;
const listeners = new Set<SessionRefreshListener>();

export function onSessionRefreshed(
  listener: SessionRefreshListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let inFlightRefresh: Promise<SilentRefreshResult | null> | null = null;
const SESSION_COOKIE_LOCK_NAME = 'storefront-session-cookie';

export async function withSessionCookieLock<T>(
  task: () => Promise<T>,
): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return await navigator.locks.request(SESSION_COOKIE_LOCK_NAME, task);
  }
  return await task();
}

function notifySessionRefreshed(result: SilentRefreshResult): void {
  listeners.forEach((listener) => {
    try {
      listener(result);
    } catch {
      // Listener exceptions should not affect token return
    }
  });
}

async function performSilentRefresh(): Promise<SilentRefreshResult | null> {
  const response = await fetch(`${API_BASE_URL}/v1/authentication/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (response.status === 401) {
    clearAccessToken();
    return null;
  }

  if (!response.ok) {
    await throwApiErrorFromResponse(response, 'Failed to restore session');
  }

  const data: unknown = await response.json();
  const tokens = parseAuthTokensPayload(data);
  setAccessToken(tokens.accessToken);

  const refreshResult: SilentRefreshResult = {
    accessToken: tokens.accessToken,
    permissions: tokens.permissions,
    mustChangePassword: tokens.mustChangePassword,
  };

  notifySessionRefreshed(refreshResult);
  return refreshResult;
}

/**
 * Single-flight silent refresh for boot and mid-request recovery.
 * Uses raw fetch so it does not re-enter browserClient middleware.
 *
 * `null` means the refresh cookie is gone or invalid (unauthenticated).
 * HTTP 5xx / 429 / network failures throw so callers keep the current session.
 */
export function silentRefreshSession(): Promise<SilentRefreshResult | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = withSessionCookieLock(performSilentRefresh).finally(
      () => {
        inFlightRefresh = null;
      },
    );
  }

  return inFlightRefresh;
}

export async function silentRefreshAccessToken(): Promise<string | null> {
  const result = await silentRefreshSession();
  return result?.accessToken ?? null;
}

export async function ensureFreshAccessToken(): Promise<string | null> {
  const current = getAccessToken();
  if (isAccessTokenUsable(current)) {
    return current;
  }

  return silentRefreshAccessToken();
}

export function resetSilentRefreshLatchForTests(): void {
  inFlightRefresh = null;
  listeners.clear();
}
