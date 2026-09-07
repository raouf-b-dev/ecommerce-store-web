import type { ReactNode } from 'react';
import { StorefrontChrome } from '@/components/layout/storefront-chrome';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
