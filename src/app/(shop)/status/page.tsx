import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { HealthStatus } from '@/features/health/components/health-status';

export const metadata: Metadata = {
  title: 'API status',
  robots: { index: false, follow: false },
};

export default function StatusPage() {
  return (
    <>
      <PageHeader
        title="API status"
        description="Live liveness of the store API. This page is not linked in shopper navigation."
      />
      <div className="mt-8">
        <Suspense
          fallback={
            <p
              className="text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              Checking API…
            </p>
          }
        >
          <HealthStatus />
        </Suspense>
      </div>
    </>
  );
}
