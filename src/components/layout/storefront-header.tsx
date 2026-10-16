import Link from 'next/link';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ShopMark } from '@/components/layout/shop-mark';
import { StorefrontNav } from '@/components/layout/storefront-nav';
import { StorefrontUserMenu } from '@/components/layout/storefront-user-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { CartHeaderBadge } from '@/features/cart/components/cart-header-badge';
import { shop } from '@/lib/shop';

type StorefrontHeaderProps = {
  variant?: 'shop' | 'auth';
};

export function StorefrontHeader({ variant = 'shop' }: StorefrontHeaderProps) {
  const showNav = variant === 'shop';

  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          {showNav ? <MobileNav /> : null}
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight whitespace-nowrap"
          >
            <ShopMark className="size-7" />
            {shop.name}
          </Link>
          {showNav ? <StorefrontNav className="ml-4 hidden lg:block" /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {showNav ? (
            <>
              <CartHeaderBadge />
              <StorefrontUserMenu />
            </>
          ) : (
            <ThemeToggle />
          )}
        </div>
      </div>
    </header>
  );
}
