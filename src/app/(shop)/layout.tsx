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
