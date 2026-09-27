'use client';

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CATALOG_SORT_OPTIONS } from '@/features/catalog/lib/catalog-params';
import type { ProductSortBy, SortOrder } from '@/features/catalog/types';

type CatalogSortSelectProps = {
  id: string;
  sortBy: ProductSortBy;
  sortOrder: SortOrder;
  /** Submit the surrounding form as soon as a sort is picked. */
  autoSubmit?: boolean;
  className?: string;
};

/**
 * One shopper-facing sort control that writes the two URL params the catalog
 * reads. Radix Select fires no native `change` event, so with `autoSubmit`
 * the choice is committed to the hidden inputs first and then submits the
 * surrounding GET form with `requestSubmit`. Parents reset it by `key` when
 * the URL changes.
 */
export function CatalogSortSelect({
  id,
  sortBy: initialSortBy,
  sortOrder: initialSortOrder,
  autoSubmit = true,
  className,
}: CatalogSortSelectProps) {
  const [sort, setSort] = useState({
    sortBy: initialSortBy,
    sortOrder: initialSortOrder,
  });
  const sortByRef = useRef<HTMLInputElement>(null);

  const current = CATALOG_SORT_OPTIONS.find(
    (option) =>
      option.sortBy === sort.sortBy && option.sortOrder === sort.sortOrder,
  );

  function handleValueChange(value: string) {
    const option = CATALOG_SORT_OPTIONS.find(
      (candidate) => candidate.value === value,
    );
    if (!option) {
      return;
    }
    const next = { sortBy: option.sortBy, sortOrder: option.sortOrder };
    if (!autoSubmit) {
      setSort(next);
      return;
    }
    flushSync(() => setSort(next));
    sortByRef.current?.form?.requestSubmit();
  }

  return (
    <>
      <input ref={sortByRef} type="hidden" name="sortBy" value={sort.sortBy} />
      <input type="hidden" name="sortOrder" value={sort.sortOrder} />
      <Select value={current?.value} onValueChange={handleValueChange}>
        <SelectTrigger id={id} className={cn('h-9 w-full', className)}>
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {CATALOG_SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
