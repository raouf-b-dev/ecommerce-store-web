'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { StorefrontNav } from '@/components/layout/storefront-nav';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth/auth-context';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { status } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Storefront sections
        </SheetDescription>
        <div className="space-y-6 p-4">
          <StorefrontNav onNavigate={() => setOpen(false)} />
          {/* Match StorefrontUserMenu: guest chrome for unauthenticated and session
              error (e.g. auth 429). The header hides these below sm. */}
          {status !== 'authenticated' && status !== 'loading' ? (
            <div className="space-y-4 sm:hidden">
              <Button size="sm" className="w-full" asChild>
                <Link href="/register" onClick={() => setOpen(false)}>
                  Create account
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
