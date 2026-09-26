'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { useServerInsertedHTML } from 'next/navigation';
import { THEME_FOUC_SCRIPT } from '@/components/theme/theme-constants';

export function ThemeScript() {
  useServerInsertedHTML(() => {
    return (
      <script
        dangerouslySetInnerHTML={{ __html: THEME_FOUC_SCRIPT }}
      />
    );
  });

  return null;
}
