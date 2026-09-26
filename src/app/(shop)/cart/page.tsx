// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { CartContent } from '@/features/cart/components/cart-content';

// ProtectedRoute must finish browser-only cookie bootstrap before cart UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

export default function CartPage() {
  return <CartContent />;
}
