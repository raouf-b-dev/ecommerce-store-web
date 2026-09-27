import { getCategories } from '@/features/catalog/api/get-categories';
import { getProducts } from '@/features/catalog/api/get-products';
import { parseCatalogSearchParams } from '@/features/catalog/lib/catalog-params';
import {
  CategoryTiles,
  type CategoryTile,
} from '@/features/catalog/components/category-tiles';
import { NewArrivals } from '@/features/catalog/components/new-arrivals';
import { BrowseAllBand } from '@/features/catalog/components/browse-all-band';
import type { CatalogFilterParams, Category } from '@/features/catalog/types';

const NEW_ARRIVALS_COUNT = 4;

async function loadCategoryTiles(
  categories: Category[],
  baseParams: CatalogFilterParams,
): Promise<CategoryTile[]> {
  const shoppable = categories.filter(
    (category) => category.isActive && category.productCount > 0,
  );
  return Promise.all(
    shoppable.map(async (category) => {
      const { items } = await getProducts({
        ...baseParams,
        categoryId: category.id,
        sortBy: 'price',
        sortOrder: 'desc',
        limit: 1,
      });
      return { category, cover: items[0] ?? null };
    }),
  );
}

/** Data-driven part of the landing page: category tiles, new arrivals, and the catalog exit. */
export async function LandingSections() {
  const baseParams = parseCatalogSearchParams({});
  const [categories, newArrivals] = await Promise.all([
    getCategories(),
    getProducts({ ...baseParams, limit: NEW_ARRIVALS_COUNT }),
  ]);
  const tiles = await loadCategoryTiles(categories, baseParams);

  return (
    <>
      <CategoryTiles tiles={tiles} />
      <NewArrivals products={newArrivals.items} />
      <BrowseAllBand total={newArrivals.total} />
    </>
  );
}
