'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';
import { StorefrontNav } from '@/components/layout/storefront-nav';
import { StorefrontSessionLinks } from '@/components/layout/storefront-session-links';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function MobileNav() {
  const [open, setOpen] = useState(false);

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
          <StorefrontSessionLinks onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
