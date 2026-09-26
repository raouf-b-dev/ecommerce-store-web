// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ProductNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      </div>

      <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        Product not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The product you are looking for may have been removed, deactivated, or
        is temporarily unavailable.
      </p>

      <div className="mt-6">
        <Button asChild>
          <Link href="/">Back to catalog</Link>
        </Button>
      </div>
    </div>
  );
}
