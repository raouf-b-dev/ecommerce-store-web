'use client';

import {
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext } from 'react';
import {
  buildSessionFromAccessToken,
  changePasswordRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  registerAndLoginRequest,
} from '@/features/auth/api/auth-api';
import type {
  AuthSession,
  AuthStatus,
  ChangePasswordInput,
  LoginCredentials,
  RegisterInput,
} from '@/features/auth/types';
import { clearAccessToken, getAccessToken } from '@/lib/auth/auth-session';
import { onSessionRefreshed } from '@/lib/api/silent-refresh';
import { isClientError } from '@/lib/api/parse-api-error';
import {
  getSessionRefetchInterval,
  getSessionRefetchOnFocusOrReconnect,
} from '@/lib/auth/session-query-policy';

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  sessionError: unknown;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<AuthSession>;
  changePassword: (input: ChangePasswordInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  clearLocalSession: () => void;
  retrySession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribeNever() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isClient = useIsClient();
  const logoutInProgress = useRef(false);

  const sessionQuery = useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: refreshSessionRequest,
    enabled: isClient,
    retry: (failureCount, error) => {
      if (isClientError(error)) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: Infinity,
    refetchInterval: (query) =>
      getSessionRefetchInterval({
        hasSession: Boolean(query.state.data),
        hasError: Boolean(query.state.error),
        accessToken: getAccessToken(),
      }),
    refetchOnWindowFocus: (query) =>
      getSessionRefetchOnFocusOrReconnect({
        hasSession: Boolean(query.state.data),
        accessToken: getAccessToken(),
      }),
    refetchOnReconnect: (query) =>
      getSessionRefetchOnFocusOrReconnect({
        hasSession: Boolean(query.state.data),
        accessToken: getAccessToken(),
      }),
  });

  useEffect(() => {
    return onSessionRefreshed((result) => {
      if (logoutInProgress.current) {
        return;
      }
      try {
        const updatedSession = buildSessionFromAccessToken(
          result.accessToken,
          result.mustChangePassword,
          result.permissions,
        );
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, updatedSession);
      } catch {
        // Ignored if token format is invalid
      }
    });
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, session);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerAndLoginRequest,
    onSuccess: (session) => {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, session);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: (session) => {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, session);
    },
  });

  function clearLocalSession() {
    clearAccessToken();
    queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    });
  }

  const logoutMutation = useMutation({
    mutationFn: async () => {
      logoutInProgress.current = true;
      await queryClient.cancelQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
      await logoutRequest();
    },
    onSuccess: () => {
      clearLocalSession();
      router.push('/login');
      router.refresh();
    },
    onSettled: () => {
      logoutInProgress.current = false;
    },
  });

  const status: AuthStatus = sessionQuery.data
    ? 'authenticated'
    : sessionQuery.isPending
      ? 'loading'
      : sessionQuery.isError
        ? 'error'
        : 'unauthenticated';

  const session = sessionQuery.data ?? null;

  const value: AuthContextValue = {
    status,
    session,
    sessionError: sessionQuery.error,
    isAuthenticated: status === 'authenticated',
    mustChangePassword: session?.mustChangePassword ?? false,
    login: (credentials) => loginMutation.mutateAsync(credentials),
    register: (input) => registerMutation.mutateAsync(input),
    changePassword: (input) => changePasswordMutation.mutateAsync(input),
    logout: () => logoutMutation.mutateAsync(),
    clearLocalSession,
    retrySession: () => {
      void queryClient.refetchQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
