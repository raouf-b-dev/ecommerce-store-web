import Link from 'next/link';
import { HorizontalScrollRow } from '@/components/layout/horizontal-scroll-row';
import { cn } from '@/lib/utils';
import { createCatalogFilterHref } from '@/features/catalog/lib/catalog-params';
import type { CatalogFilterParams, Category } from '@/features/catalog/types';

type CategoryPillsProps = {
  categories: Category[];
  activeParams: CatalogFilterParams;
};

function pillClassName(isActive: boolean) {
  return cn(
    'inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    isActive
      ? 'bg-primary text-primary-foreground shadow-xs'
      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
  );
}

export function CategoryPills({
  categories,
  activeParams,
}: CategoryPillsProps) {
  const isAllActive = activeParams.categoryId === undefined;

  return (
    <nav aria-label="Categories" className="w-full">
      {/* Remount per category so the row re-centers on the active pill. */}
      <HorizontalScrollRow
        key={activeParams.categoryId ?? 'all'}
        className="-mx-6 px-6"
      >
        <ul className="flex w-max items-center gap-2 pb-2 pr-6 *:snap-start">
          <li>
            <Link
              href={createCatalogFilterHref(activeParams, {
                categoryId: undefined,
              })}
              className={pillClassName(isAllActive)}
              aria-current={isAllActive ? 'page' : undefined}
            >
              All Products
            </Link>
          </li>
          {categories.map((category) => {
            const isActive = activeParams.categoryId === category.id;
            return (
              <li key={category.id}>
                <Link
                  href={createCatalogFilterHref(activeParams, {
                    categoryId: category.id,
                  })}
                  className={pillClassName(isActive)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </HorizontalScrollRow>
    </nav>
  );
}
