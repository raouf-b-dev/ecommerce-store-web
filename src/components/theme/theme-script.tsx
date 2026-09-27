'use client';

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
