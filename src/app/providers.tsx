'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { hasHttpStatus } from '@/lib/api/parse-api-error';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ThemeAwareToaster } from '@/components/theme/theme-aware-toaster';
import { MockModeBootstrap } from '@/components/mock/mock-mode-bootstrap';
import { clearStoredCartId } from '@/features/cart/lib/cart-storage';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (hasHttpStatus(error, 429)) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider>
      <MockModeBootstrap>
        <QueryClientProvider client={queryClient}>
          <AuthProvider onClearLocalSideEffects={clearStoredCartId}>
            {children}
          </AuthProvider>
        </QueryClientProvider>
        <ThemeAwareToaster />
      </MockModeBootstrap>
    </ThemeProvider>
  );
}
