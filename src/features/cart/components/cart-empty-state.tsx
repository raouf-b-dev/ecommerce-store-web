import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CartEmptyState() {
  return (
    <div
      data-testid="cart-empty-state"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 px-4 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShoppingBag className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
        Your cart is empty
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Looks like you haven&apos;t added any products to your cart yet. Explore
        our catalog to get started.
      </p>
      <Button asChild className="mt-6 font-medium">
        <Link href="/">Explore products</Link>
      </Button>
    </div>
  );
}
