import { redirect } from 'next/navigation';
import { getCategories } from '@/features/catalog/api/get-categories';
import { getProducts } from '@/features/catalog/api/get-products';
import {
  createCatalogFilterHref,
  parseCatalogSearchParams,
} from '@/features/catalog/lib/catalog-params';
import { CategoryPills } from '@/features/catalog/components/category-pills';
import { CatalogFilters } from '@/features/catalog/components/catalog-filters';
import { ProductGrid } from '@/features/catalog/components/product-grid';
import { CatalogPagination } from '@/features/catalog/components/catalog-pagination';

type CatalogContentProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

  return (
    <div className="space-y-6">
      <CategoryPills categories={categories} activeParams={params} />
      <CatalogFilters activeParams={params} />
      <ProductGrid products={paginatedProducts.items} />
      <CatalogPagination
        totalPages={paginatedProducts.totalPages}
        currentPage={paginatedProducts.page}
        currentParams={params}
      />
    </div>
  );
}
