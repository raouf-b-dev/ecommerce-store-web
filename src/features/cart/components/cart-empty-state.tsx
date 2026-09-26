// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/empty-state';

export function CartEmptyState() {
  return (
    <EmptyState
      data-testid="cart-empty-state"
      className="py-16"
      icon={<ShoppingBag className="h-8 w-8" aria-hidden="true" />}
      title="Your cart is empty"
      description="Looks like you haven&apos;t added any products to your cart yet. Explore our catalog to get started."
    >
      <Button asChild className="font-medium">
        <Link href="/">Explore products</Link>
      </Button>
    </EmptyState>
  );
}
