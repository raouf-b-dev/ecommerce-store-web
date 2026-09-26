// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createCatalogFilterHref } from '@/features/catalog/lib/catalog-params';
import type { CatalogFilterParams, Category } from '@/features/catalog/types';

type CategoryPillsProps = {
  categories: Category[];
  activeParams: CatalogFilterParams;
};

export function CategoryPills({
  categories,
  activeParams,
}: CategoryPillsProps) {
  const isAllActive = activeParams.categoryId === undefined;

  return (
    <nav aria-label="Categories" className="w-full">
      <ul className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <li>
          <Link
            href={createCatalogFilterHref(activeParams, { categoryId: undefined })}
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              isAllActive
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
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
                href={createCatalogFilterHref(activeParams, { categoryId: category.id })}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
