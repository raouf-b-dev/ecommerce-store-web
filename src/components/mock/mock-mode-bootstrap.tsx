'use client';

import { useEffect, useState, type ReactNode } from 'react';

let mockWorkerStartPromise: Promise<void> | null = null;

function ensureMockWorkerStarted(): Promise<void> {
  if (mockWorkerStartPromise === null) {
    mockWorkerStartPromise = import('@/lib/mock/browser').then(
      async ({ worker }) => {
        await worker.start({
          onUnhandledRequest: 'bypass',
          quiet: true,
        });
      },
    );
  }
  return mockWorkerStartPromise;
}

export function MockModeBootstrap({ children }: { children: ReactNode }) {
  // Inline env gate so production builds can drop the MSW browser chunk.
  const mockEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';
  const [ready, setReady] = useState(!mockEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mockEnabled) {
      return;
    }

    let cancelled = false;

    void ensureMockWorkerStarted()
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch((cause: unknown) => {
        console.error('Failed to start mock service worker:', cause);
        // Allow a retry after a failed start (e.g. SW registration flake).
        mockWorkerStartPromise = null;
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Mock service worker failed to start.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mockEnabled]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-md space-y-2 text-center">
          <p className="font-medium text-foreground">Mock preview unavailable</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Restart with <code className="text-foreground">npm run dev:mock</code>
            , or hard-refresh if the service worker is stale.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return null;
  }

  return children;
}
