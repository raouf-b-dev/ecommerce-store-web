'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function MockModeBootstrap({ children }: { children: ReactNode }) {
  const mockEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';
  const [ready, setReady] = useState(!mockEnabled);

  useEffect(() => {
    if (!mockEnabled) {
      return;
    }

    void import('@/lib/mock/browser')
      .then(({ worker }) =>
        worker.start({
          onUnhandledRequest: 'bypass',
          quiet: true,
        }),
      )
      .then(() => setReady(true));
  }, [mockEnabled]);

  if (!ready) {
    return null;
  }

  return children;
}
