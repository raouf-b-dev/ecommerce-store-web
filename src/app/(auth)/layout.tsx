import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { AuthChrome } from '@/components/layout/auth-chrome';
import { NO_INDEX_ROBOTS } from '@/lib/seo/config';

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthChrome>{children}</AuthChrome>;
}
