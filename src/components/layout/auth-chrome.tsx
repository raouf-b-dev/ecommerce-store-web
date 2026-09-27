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
