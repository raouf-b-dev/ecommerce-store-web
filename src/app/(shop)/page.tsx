import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { CatalogContent } from '@/features/catalog/components/catalog-content';
import { CatalogShellSkeleton } from '@/features/catalog/components/catalog-shell-skeleton';

export const metadata: Metadata = {
  title: 'Browse Products',
  description: 'Explore our catalog of high quality products.',
};

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Browse our collection of high quality products."
      />
      <Suspense fallback={<CatalogShellSkeleton />}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
