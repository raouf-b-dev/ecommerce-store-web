import Link from 'next/link';
import { MobileNav } from '@/components/layout/mobile-nav';
import { StorefrontNav } from '@/components/layout/storefront-nav';
import { ThemeToggle } from '@/components/theme/theme-toggle';

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
          {showNav ? (
            <StorefrontNav className="hidden lg:block" />
          ) : null}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
