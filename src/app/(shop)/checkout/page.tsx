// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { CheckoutContent } from '@/features/checkout/components/checkout-content';

// ProtectedRoute must finish browser-only cookie bootstrap before checkout UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Checkout
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete your order with secure payment and address confirmation.
        </p>
      </div>
      <CheckoutContent />
    </div>
  );
}
