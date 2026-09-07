import type { ReactNode } from 'react';
import { StorefrontChrome } from '@/components/layout/storefront-chrome';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
