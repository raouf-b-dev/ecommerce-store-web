import type { ReactNode } from 'react';
import { SkipLink } from '@/components/layout/skip-link';
import { StorefrontFooter } from '@/components/layout/storefront-footer';
import { StorefrontHeader } from '@/components/layout/storefront-header';

type StorefrontChromeProps = {
  children: ReactNode;
};

export function StorefrontChrome({ children }: StorefrontChromeProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <StorefrontHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 outline-none"
      >
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
}
