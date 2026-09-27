import Link from 'next/link';
import { ProductImageFrame } from '@/components/media/product-image';
import { catalogHref } from '@/features/catalog/lib/catalog-params';
import type { Category, ProductListItem } from '@/features/catalog/types';

export type CategoryTile = {
  category: Category;
  /** Highest-priced product in the category; its photo stands in for a category image. */
  cover: ProductListItem | null;
};

type CategoryTilesProps = {
  tiles: CategoryTile[];
};

export function CategoryTiles({ tiles }: CategoryTilesProps) {
  if (tiles.length === 0) {
    return null;
  }

  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="scroll-mt-24 space-y-4"
    >
      <h2
        id="categories-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Shop by category
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {tiles.map(({ category, cover }) => (
          <li key={category.id}>
            <Link
              href={catalogHref({ categoryId: category.id })}
              className="group block overflow-hidden rounded-xl border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ProductImageFrame
                src={cover?.imageUrl}
                name={category.name}
                categoryId={category.id}
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="w-full rounded-none"
                imageClassName="group-hover:scale-105"
              />
              <div className="flex items-baseline justify-between gap-2 p-3">
                <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                  {category.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {category.productCount}{' '}
                  {category.productCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
