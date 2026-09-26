'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api/parse-api-error';
import { useAuth } from '@/lib/auth/auth-context';

type StorefrontSessionLinksProps = {
  onNavigate?: () => void;
};

export function StorefrontSessionLinks({
  onNavigate,
}: StorefrontSessionLinksProps) {
  const { status, session, logout } = useAuth();

  if (status === 'loading' || status === 'error') {
    return (
      <div
        className="flex h-8 min-w-36 items-center justify-end"
        aria-hidden="true"
      />
    );
  }

  if (status === 'authenticated' && session) {
    async function handleLogout() {
      try {
        await logout();
        onNavigate?.();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not sign out. Try again.'));
      }
    }

    return (
      <div className="flex min-w-36 flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:justify-end">
        <span
          className="truncate text-sm text-muted-foreground"
          title={session.email}
        >
          {session.email}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account" onClick={onNavigate}>
            Account
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders" onClick={onNavigate}>
            Orders
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => {
            void handleLogout();
          }}
        >
          Log out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-36 items-center justify-end gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login" onClick={onNavigate}>
          Sign in
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/register" onClick={onNavigate}>
          Create account
        </Link>
      </Button>
    </div>
  );
}
