'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: MIT

import { useAuth } from '@/lib/auth/auth-context';

export function AccountSessionSummary() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">
      Signed in as{' '}
      <span className="font-medium text-foreground">{session.email}</span>.
    </p>
  );
}
