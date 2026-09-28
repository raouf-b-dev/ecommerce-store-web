'use client';

import Form from 'next/form';
import { useState } from 'react';
import { SlidersHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CatalogSortSelect } from '@/features/catalog/components/catalog-sort-select';
import {
  CATALOG_PATH,
  DEFAULT_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '@/features/catalog/lib/catalog-params';
import type { CatalogFilterParams } from '@/features/catalog/types';

type CatalogFiltersSheetProps = {
  activeParams: CatalogFilterParams;
  activeCount: number;
};

/** Price and sort for small screens. Its own GET form, so the search row stays compact. */
export function CatalogFiltersSheet({
  activeParams,
  activeCount,
}: CatalogFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0 gap-2 px-3 md:hidden"
        >
          <SlidersHorizontalIcon aria-hidden="true" />
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <Form
          action={CATALOG_PATH}
          onSubmit={() => setOpen(false)}
          className="flex flex-col"
        >
          <SheetHeader className="px-5 pt-5">
            <SheetTitle>Filter and sort</SheetTitle>
            <SheetDescription>
              Narrow the catalog by price or change the order.
            </SheetDescription>
          </SheetHeader>

          {activeParams.search ? (
            <input type="hidden" name="search" value={activeParams.search} />
          ) : null}
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

          <div className="space-y-5 px-5 py-2">
            <div className="space-y-1.5">
              <label
                htmlFor="catalog-sheet-sort"
                className="text-sm font-medium"
              >
                Sort by
              </label>
              <CatalogSortSelect
                id="catalog-sheet-sort"
                sortBy={activeParams.sortBy ?? DEFAULT_SORT_BY}
                sortOrder={activeParams.sortOrder ?? DEFAULT_SORT_ORDER}
                autoSubmit={false}
              />
            </div>

            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">Price</legend>
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Minimum price"
                  name="minPrice"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="Min"
                  defaultValue={activeParams.minPrice ?? ''}
                  className="h-10"
                />
                <span aria-hidden="true" className="text-muted-foreground">
                  to
                </span>
                <Input
                  aria-label="Maximum price"
                  name="maxPrice"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="Max"
                  defaultValue={activeParams.maxPrice ?? ''}
                  className="h-10"
                />
              </div>
            </fieldset>
          </div>

          <SheetFooter className="px-5 pb-6">
            <Button type="submit" size="lg" className="h-11 text-base">
              Show results
            </Button>
          </SheetFooter>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
