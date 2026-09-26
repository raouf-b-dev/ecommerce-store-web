// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactNode } from 'react';
import { StorefrontChrome } from '@/components/layout/storefront-chrome';
import { RequirePasswordChanged } from '@/lib/auth/password-change-routes';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <StorefrontChrome>
      <RequirePasswordChanged>{children}</RequirePasswordChanged>
    </StorefrontChrome>
  );
}
