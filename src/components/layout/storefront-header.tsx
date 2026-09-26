// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import { MobileNav } from '@/components/layout/mobile-nav';
import { StorefrontNav } from '@/components/layout/storefront-nav';
import { StorefrontSessionLinks } from '@/components/layout/storefront-session-links';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { CartHeaderBadge } from '@/features/cart/components/cart-header-badge';

type StorefrontHeaderProps = {
  variant?: 'shop' | 'auth';
};

export function StorefrontHeader({ variant = 'shop' }: StorefrontHeaderProps) {
  const showNav = variant === 'shop';

  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          {showNav ? <MobileNav /> : null}
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Storefront
          </Link>
          {showNav ? <StorefrontNav className="hidden lg:block" /> : null}
        </div>
        <div className="flex items-center gap-3">
          {showNav ? (
            <>
              <CartHeaderBadge />
              <div className="hidden lg:block">
                <StorefrontSessionLinks />
              </div>
            </>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
