'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { cn } from 'cn';

const NAV_ITEMS: ReadonlyArray<{
  href: Route;
  label: string;
  match: (pathname: string) => boolean;
}> = [
  {
    href: '/account',
    label: 'Account',
    match: (pathname) => pathname === '/account',
  },
  {
    href: '/orders',
    label: 'Orders',
    match: (pathname) =>
      pathname === '/orders' || pathname.startsWith('/orders/'),
  },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex flex-wrap items-center gap-1 border-b pb-3">
      {NAV_ITEMS.map((item) => {
        const isActive = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
