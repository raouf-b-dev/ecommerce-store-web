import Form from 'next/form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_LIMIT,
  SORT_BY_OPTIONS,
  SORT_ORDER_OPTIONS,
} from '@/features/catalog/lib/catalog-params';
import type { CatalogFilterParams } from '@/features/catalog/types';

type CatalogFiltersProps = {
  activeParams: CatalogFilterParams;
};

export function CatalogFilters({ activeParams }: CatalogFiltersProps) {
  const hasActiveFilters = Boolean(
    activeParams.search ||
      activeParams.categoryId !== undefined ||
      activeParams.minPrice !== undefined ||
      activeParams.maxPrice !== undefined ||
      activeParams.sortBy !== 'createdAt' ||
      activeParams.sortOrder !== 'desc',
  );

  return (
    <Form
      action="/"
      className="flex flex-col gap-3 rounded-xl border bg-card/60 p-4 shadow-xs backdrop-blur-xs"
    >
      {activeParams.categoryId !== undefined ? (
        <input
          type="hidden"
          name="categoryId"
          value={activeParams.categoryId}
        />
      ) : null}

      {activeParams.limit && activeParams.limit !== DEFAULT_LIMIT ? (
        <input type="hidden" name="limit" value={activeParams.limit} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="lg:col-span-2">
          <label
            htmlFor="catalog-search"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Search
          </label>
          <Input
            id="catalog-search"
            name="search"
            defaultValue={activeParams.search ?? ''}
            placeholder="Search by name, SKU..."
            className="h-9"
          />
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="catalog-min-price"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Min Price
            </label>
            <Input
              id="catalog-min-price"
              name="minPrice"
              type="number"
              min="0"
              step="any"
              defaultValue={activeParams.minPrice ?? ''}
              placeholder="0"
              className="h-9"
            />
          </div>
          <div>
            <label
              htmlFor="catalog-max-price"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Max Price
            </label>
            <Input
              id="catalog-max-price"
              name="maxPrice"
              type="number"
              min="0"
              step="any"
              defaultValue={activeParams.maxPrice ?? ''}
              placeholder="Max"
              className="h-9"
            />
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label
            htmlFor="catalog-sort-by"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Sort By
          </label>
          <select
            id="catalog-sort-by"
            name="sortBy"
            defaultValue={activeParams.sortBy}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {SORT_BY_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-background text-foreground"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label
            htmlFor="catalog-sort-order"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Order
          </label>
          <select
            id="catalog-sort-order"
            name="sortOrder"
            defaultValue={activeParams.sortOrder}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {SORT_ORDER_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-background text-foreground"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          {hasActiveFilters ? (
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Reset filters
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" className="h-9 px-4">
            Apply
          </Button>
        </div>
      </div>
    </Form>
  );
}
