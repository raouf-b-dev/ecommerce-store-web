// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Suspense } from 'react';
import { CacheComponentsDynamicMarker } from '@/components/seo/cache-components-dynamic-marker';
import { FocusMainOnNavigate } from '@/components/layout/focus-main-on-navigate';
import { cn } from '@/lib/utils';
import { seoConfig } from '@/lib/seo/config';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { ThemeScript } from '@/components/theme/theme-script';
import { Providers } from '@/app/providers';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(getStorefrontOrigin()),
  title: {
    default: seoConfig.siteName,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.description,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans', geist.variable)}
    >
      <head>
        <ThemeScript />
      </head>
      <Suspense fallback={null}>
        <CacheComponentsDynamicMarker />
      </Suspense>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
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
