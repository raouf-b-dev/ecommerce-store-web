import { Suspense } from 'react';
import type { PageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/page-header';
import { CatalogContent } from '@/features/catalog/components/catalog-content';
import { CatalogShellSkeleton } from '@/features/catalog/components/catalog-shell-skeleton';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { parseCatalogSearchParams } from '@/features/catalog/lib/catalog-params';
import { getCategories } from '@/features/catalog/api/get-categories';
import {
  buildCatalogMetadata,
  isCategoryIdMalformed,
  type CatalogCategoryState,
} from '@/features/catalog/lib/catalog-seo';

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Catalog metadata depends on searchParams; opt out of instant-shell validation. */
export const instant = false;

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<PageMetadata> {
  const rawParams = await searchParams;
  const origin = getStorefrontOrigin();
  const parsedParams = parseCatalogSearchParams(rawParams);

  let categoryState: CatalogCategoryState;

  if (rawParams.categoryId !== undefined) {
    if (isCategoryIdMalformed(rawParams.categoryId)) {
      categoryState = { status: 'malformed' };
    } else {
      const categories = await getCategories();
      const found = categories.find((c) => c.id === parsedParams.categoryId);
      if (found && found.isActive) {
        categoryState = {
          status: 'valid',
          category: found,
          hasProducts: found.productCount > 0,
        };
      } else {
        categoryState = { status: 'nonexistent' };
      }
    }
  } else {
    categoryState = { status: 'none' };
  }

  return buildCatalogMetadata({
    origin,
    params: parsedParams,
    categoryState,
  });
}

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
