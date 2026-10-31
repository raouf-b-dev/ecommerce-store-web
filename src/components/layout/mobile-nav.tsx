'use client';

import Link from 'next/link';
import { Menu, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StorefrontNav } from '@/components/layout/storefront-nav';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/features/cart/hooks/use-cart';
import { getErrorMessage } from '@/lib/api/parse-api-error';
import { getChangePasswordRedirectPath } from '@/lib/auth/auth-routes';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

const drawerLinkClassName =
  'flex min-h-11 w-full items-center rounded-md px-2 text-sm font-medium transition-colors hover:bg-muted';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { status, session, logout } = useAuth();
  const { lineItemCount } = useCart();
  const close = () => setOpen(false);
  const cartCount = status === 'authenticated' ? lineItemCount : 0;

  async function handleLogout() {
    try {
      await logout();
      close();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not sign out. Try again.'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          className="size-11 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] gap-0 p-0">
        <SheetHeader className="border-b px-4 py-4 pr-12 text-left">
          <SheetTitle>Navigation menu</SheetTitle>
          <SheetDescription className="sr-only">
            Storefront sections, cart, account, and appearance
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 p-4">
          <StorefrontNav onNavigate={close} />

          <nav aria-label="Cart and account" className="space-y-1">
            <Link href="/cart" onClick={close} className={drawerLinkClassName}>
              <ShoppingCart
                className="mr-2 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>Cart</span>
              {cartCount > 0 ? (
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>

            {status === 'authenticated' && session ? (
              <>
                <Link
                  href="/orders"
                  onClick={close}
                  className={drawerLinkClassName}
                >
                  My Orders
                </Link>
                <Link
                  href="/account"
                  onClick={close}
                  className={drawerLinkClassName}
                >
                  Account Settings
                </Link>
                {session.permissions.includes('change_own_credentials') ? (
                  <Link
                    href={getChangePasswordRedirectPath('/account')}
                    onClick={close}
                    className={drawerLinkClassName}
                  >
                    Change password
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  className={cn(
                    drawerLinkClassName,
                    'text-left text-destructive hover:text-destructive',
                  )}
                >
                  Sign out
                </button>
              </>
            ) : null}

            {status !== 'authenticated' && status !== 'loading' ? (
              <>
                <Button
                  variant="ghost"
                  className="h-11 w-full justify-start px-2"
                  asChild
                >
                  <Link href="/login" onClick={close}>
                    Sign in
                  </Link>
                </Button>
                <Button className="h-11 w-full" asChild>
                  <Link href="/register" onClick={close}>
                    Create account
                  </Link>
                </Button>
              </>
            ) : null}
          </nav>

          {status !== 'loading' ? (
            <div className="space-y-2">
              <p className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Appearance
              </p>
              <ThemeToggle />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
