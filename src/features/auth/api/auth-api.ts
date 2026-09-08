import { browserClient } from '@/lib/api/browser-client';
import { toApiRequestError } from '@/lib/api/parse-api-error';
import { throwApiErrorFromResponse } from '@/lib/api/throw-api-error';
import {
  ensureFreshAccessToken,
  silentRefreshSession,
  withSessionCookieLock,
} from '@/lib/api/silent-refresh';
import { parseAuthTokensPayload } from '@/lib/auth/parse-auth-tokens';
import { setAccessToken } from '@/lib/auth/auth-session';
import { decodeAccessTokenClaims } from '@/features/auth/lib/jwt-decode';
import type {
  AuthSession,
  ChangePasswordInput,
  LoginCredentials,
  RegisterInput,
} from '@/features/auth/types';

export const AUTH_THROTTLE_MESSAGE =
  'Too many sign-in attempts. Wait about a minute and try again.';
export const PASSWORD_CHANGE_THROTTLE_MESSAGE =
  'Too many password-change attempts. Wait about a minute and try again.';

export function buildSessionFromAccessToken(
  accessToken: string,
  mustChangePassword = false,
  permissions: string[] = [],
): AuthSession {
  const claims = decodeAccessTokenClaims(accessToken);
  if (!claims) {
    throw new Error('Invalid access token');
  }

  setAccessToken(accessToken);

  return {
    userId: claims.sub,
    email: claims.email,
    role: claims.role,
    permissions,
    mustChangePassword:
      mustChangePassword || claims.mustChangePassword === true,
  };
}

export async function loginRequest(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  const { data, error, response } = await browserClient.POST(
    '/v1/authentication/login',
    {
      body: credentials,
    },
  );

  if (error || !response.ok) {
    if (response?.status === 429) {
      throw toApiRequestError(
        response,
        {
          statusCode: 429,
          message: AUTH_THROTTLE_MESSAGE,
        },
        AUTH_THROTTLE_MESSAGE,
      );
    }
    if (response?.status === 401) {
      throw toApiRequestError(
        response,
        {
          statusCode: 401,
          message: 'Invalid email or password.',
        },
        'Invalid email or password.',
      );
    }
    await throwApiErrorFromResponse(response, 'Invalid email or password.');
  }

  const tokens = parseAuthTokensPayload(data);
  return buildSessionFromAccessToken(
    tokens.accessToken,
    tokens.mustChangePassword,
    tokens.permissions,
  );
}

export async function registerRequest(input: RegisterInput): Promise<void> {
  const { error, response } = await browserClient.POST(
    '/v1/authentication/register',
    {
      body: input,
    },
  );

  if (error || !response.ok) {
    if (response?.status === 429) {
      throw toApiRequestError(
        response,
        {
          statusCode: 429,
          message: AUTH_THROTTLE_MESSAGE,
        },
        AUTH_THROTTLE_MESSAGE,
      );
    }
    await throwApiErrorFromResponse(response, 'Could not create account.');
  }
}

export async function registerAndLoginRequest(
  input: RegisterInput,
): Promise<AuthSession> {
  await registerRequest(input);
  return loginRequest({
    email: input.email,
    password: input.password,
  });
}

export async function refreshSessionRequest(): Promise<AuthSession | null> {
  const result = await silentRefreshSession();
  if (!result) {
    return null;
  }

  return buildSessionFromAccessToken(
    result.accessToken,
    result.mustChangePassword,
    result.permissions,
  );
}

export async function changePasswordRequest(
  input: ChangePasswordInput,
): Promise<AuthSession> {
  const { data, error, response } = await browserClient.POST(
    '/v1/authentication/change-password',
    {
      body: input,
    },
  );

  if (error || !response.ok) {
    if (response?.status === 429) {
      throw toApiRequestError(
        response,
        {
          statusCode: 429,
          message: PASSWORD_CHANGE_THROTTLE_MESSAGE,
        },
        PASSWORD_CHANGE_THROTTLE_MESSAGE,
      );
    }
    await throwApiErrorFromResponse(response, 'Could not update password.');
  }

  const tokens = parseAuthTokensPayload(data);
  return buildSessionFromAccessToken(
    tokens.accessToken,
    tokens.mustChangePassword,
    tokens.permissions,
  );
}

export async function logoutRequest(): Promise<void> {
  const accessToken = await ensureFreshAccessToken();
  if (!accessToken) {
    return;
  }

  const { error, response } = await withSessionCookieLock(() =>
    browserClient.POST('/v1/authentication/logout', {
      body: {},
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );

  if (response.status === 401) {
    return;
  }
  if (error || !response.ok) {
    await throwApiErrorFromResponse(response, 'Could not sign out.');
  }
}
