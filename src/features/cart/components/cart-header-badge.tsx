'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useAuth } from '@/lib/auth/auth-context';

export function CartHeaderBadge() {
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  const count = isAuthenticated ? itemCount : 0;
  const label =
    count > 0 ? `Shopping cart, ${count} items` : 'Shopping cart, 0 items';

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
    >
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      {count > 0 ? (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums shadow-xs"
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
