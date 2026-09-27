import Form from 'next/form';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CatalogFiltersSheet } from '@/features/catalog/components/catalog-filters-sheet';
import { CatalogSortSelect } from '@/features/catalog/components/catalog-sort-select';
import {
  CATALOG_PATH,
  DEFAULT_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  createCatalogFilterHref,
} from '@/features/catalog/lib/catalog-params';
import type { CatalogFilterParams } from '@/features/catalog/types';

type CatalogFiltersProps = {
  activeParams: CatalogFilterParams;
};

/**
 * Compact GET form. The URL stays the source of truth: search and price apply
 * on Enter (or the Apply button), the sort select applies on change.
 */
export function CatalogFilters({ activeParams }: CatalogFiltersProps) {
  const hasPrice =
    activeParams.minPrice !== undefined || activeParams.maxPrice !== undefined;
  const hasCustomSort =
    activeParams.sortBy !== DEFAULT_SORT_BY ||
    activeParams.sortOrder !== DEFAULT_SORT_ORDER;
  const canClear = Boolean(activeParams.search) || hasPrice || hasCustomSort;
  const sheetCount = Number(hasPrice) + Number(hasCustomSort);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Form
          action={CATALOG_PATH}
          role="search"
          aria-label="Search and filter products"
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          {activeParams.categoryId !== undefined ? (
            <input
              type="hidden"
              name="categoryId"
              value={activeParams.categoryId}
            />
          ) : null}
          {activeParams.limit !== DEFAULT_LIMIT ? (
            <input type="hidden" name="limit" value={activeParams.limit} />
          ) : null}

          <div className="relative min-w-0 flex-1">
            <label htmlFor="catalog-search" className="sr-only">
              Search products
            </label>
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="catalog-search"
              name="search"
              type="search"
              enterKeyHint="search"
              defaultValue={activeParams.search ?? ''}
              placeholder="Search products"
              className="h-9 pl-9"
            />
          </div>

          {/* Price and sort sit inline from md up; the sheet carries them on small screens. */}
          <div className="hidden items-center gap-2 md:flex">
            <Input
              aria-label="Minimum price"
              name="minPrice"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="Min price"
              defaultValue={activeParams.minPrice ?? ''}
              className="h-9 w-28"
            />
            <span aria-hidden="true" className="text-sm text-muted-foreground">
              to
            </span>
            <Input
              aria-label="Maximum price"
              name="maxPrice"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="Max price"
              defaultValue={activeParams.maxPrice ?? ''}
              className="h-9 w-28"
            />
            <Button type="submit" variant="outline" className="h-9 px-3">
              Apply
            </Button>
            <label htmlFor="catalog-sort" className="sr-only">
              Sort products
            </label>
            <CatalogSortSelect
              id="catalog-sort"
              sortBy={activeParams.sortBy ?? DEFAULT_SORT_BY}
              sortOrder={activeParams.sortOrder ?? DEFAULT_SORT_ORDER}
              className="w-48"
            />
          </div>
        </Form>

        {/* Outside the form above: React bubbles submit events through the sheet's portal. */}
        <CatalogFiltersSheet
          activeParams={activeParams}
          activeCount={sheetCount}
        />
      </div>

      {canClear ? (
        <div>
          <Link
            href={createCatalogFilterHref(activeParams, {
              search: undefined,
              minPrice: undefined,
              maxPrice: undefined,
              sortBy: DEFAULT_SORT_BY,
              sortOrder: DEFAULT_SORT_ORDER,
            })}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear search and filters
          </Link>
        </div>
      ) : null}
    </div>
  );
}
