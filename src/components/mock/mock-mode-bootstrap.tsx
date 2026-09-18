'use client';

import { useEffect, useState, type ReactNode } from 'react';

let mockWorkerStartPromise: Promise<void> | null = null;

function ensureMockWorkerStarted(): Promise<void> {
  if (mockWorkerStartPromise === null) {
    mockWorkerStartPromise = import('@/lib/mock/browser').then(async ({ worker }) => {
      await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true,
      });
    });
  }
  return mockWorkerStartPromise;
}

export function MockModeBootstrap({ children }: { children: ReactNode }) {
  const mockEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';
  const [ready, setReady] = useState(!mockEnabled);

  useEffect(() => {
    if (!mockEnabled) {
      return;
    }

    void ensureMockWorkerStarted().then(() => setReady(true));
  }, [mockEnabled]);

  if (!ready) {
    return null;
  }

  return children;
}
