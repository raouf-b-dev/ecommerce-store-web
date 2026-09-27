import { redirect } from 'next/navigation';
import { getCategories } from '@/features/catalog/api/get-categories';
import { getProducts } from '@/features/catalog/api/get-products';
import {
  createCatalogFilterHref,
  hasActiveCatalogFilters,
  parseCatalogSearchParams,
} from '@/features/catalog/lib/catalog-params';
import { CategoryPills } from '@/features/catalog/components/category-pills';
import { CatalogFilters } from '@/features/catalog/components/catalog-filters';
import { ProductGrid } from '@/features/catalog/components/product-grid';
import { CatalogPagination } from '@/features/catalog/components/catalog-pagination';
import type { CatalogFilterParams, Category } from '@/features/catalog/types';

type CatalogContentProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function catalogHeading(
  params: CatalogFilterParams,
  categories: Category[],
): string {
  if (params.search) {
    return `Results for "${params.search}"`;
  }
  const category = categories.find(
    (candidate) => candidate.id === params.categoryId,
  );
  return category?.name ?? 'All products';
}

export async function CatalogContent({ searchParams }: CatalogContentProps) {
  const rawParams = await searchParams;
  const params = parseCatalogSearchParams(rawParams);

  const [categories, paginatedProducts] = await Promise.all([
    getCategories(),
    getProducts(params),
  ]);

  if (
    paginatedProducts.totalPages > 0 &&
    params.page > paginatedProducts.totalPages
  ) {
    redirect(
      createCatalogFilterHref(
        params,
        { page: paginatedProducts.totalPages },
        false,
      ),
    );
  }

  const total = paginatedProducts.total;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {catalogHeading(params, categories)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'product' : 'products'}
        </p>
      </div>
      <CategoryPills categories={categories} activeParams={params} />
      {/* Keyed by the URL so uncontrolled inputs and the sort select reset on navigation. */}
      <CatalogFilters
        key={createCatalogFilterHref(params, {})}
        activeParams={params}
      />
      <ProductGrid
        products={paginatedProducts.items}
        hasActiveFilters={hasActiveCatalogFilters(params)}
      />
      <CatalogPagination
        totalPages={paginatedProducts.totalPages}
        currentPage={paginatedProducts.page}
        currentParams={params}
      />
    </div>
  );
}
