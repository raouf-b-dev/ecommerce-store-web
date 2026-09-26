// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactNode } from 'react';
import { SkipLink } from '@/components/layout/skip-link';
import { StorefrontHeader } from '@/components/layout/storefront-header';

type AuthChromeProps = {
  children: ReactNode;
};

export function AuthChrome({ children }: AuthChromeProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <StorefrontHeader variant="auth" />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-md flex-1 px-6 py-10 outline-none"
      >
        {children}
      </main>
    </div>
  );
}
