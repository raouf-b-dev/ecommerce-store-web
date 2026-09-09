import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Suspense } from 'react';
import { FocusMainOnNavigate } from '@/components/layout/focus-main-on-navigate';
import { THEME_FOUC_SCRIPT } from '@/components/theme/theme-constants';
import { cn } from '@/lib/utils';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { Providers } from '@/app/providers';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(getStorefrontOrigin()),
  title: { default: 'Storefront', template: '%s | Storefront' },
  description: 'Customer storefront for the E-commerce Store API.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans', geist.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_FOUC_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <Suspense fallback={null}>
            <FocusMainOnNavigate />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
