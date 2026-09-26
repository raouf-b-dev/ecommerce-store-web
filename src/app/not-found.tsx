// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { PageHeader } from '@/components/layout/page-header';
import { StorefrontChrome } from '@/components/layout/storefront-chrome';

export default function NotFound() {
  return (
    <StorefrontChrome>
      <PageHeader
        title="Page not found"
        description="That address is not a storefront page."
      />
    </StorefrontChrome>
  );
}
