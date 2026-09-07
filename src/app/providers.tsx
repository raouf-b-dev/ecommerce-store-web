'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ThemeAwareToaster } from '@/components/theme/theme-aware-toaster';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <ThemeAwareToaster />
    </ThemeProvider>
  );
}
