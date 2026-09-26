// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createCatalogFilterHref } from '@/features/catalog/lib/catalog-params';
import type { CatalogFilterParams } from '@/features/catalog/types';

type CatalogPaginationProps = {
  totalPages: number;
  currentPage: number;
  currentParams: CatalogFilterParams;
};

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

export function CatalogPagination({
  totalPages,
  currentPage,
  currentParams,
}: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const items = getVisiblePages(safeCurrentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-1.5"
    >
      {safeCurrentPage > 1 ? (
        <Link
          href={createCatalogFilterHref(
            currentParams,
            { page: safeCurrentPage - 1 },
            false,
          )}
          aria-label="Go to previous page"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Previous
        </Link>
      ) : null}

      <div className="flex items-center gap-1">
        {items.map((item, idx) => {
          if (item === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-9 w-9 items-center justify-center text-xs text-muted-foreground"
                aria-hidden="true"
              >
                …
              </span>
            );
          }

          const isCurrent = item === safeCurrentPage;
          return (
            <Link
              key={item}
              href={createCatalogFilterHref(
                currentParams,
                { page: item },
                false,
              )}
              aria-label={`Page ${item}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                isCurrent
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'border border-input bg-background text-foreground hover:bg-muted',
              )}
            >
              {item}
            </Link>
          );
        })}
      </div>

      {safeCurrentPage < totalPages ? (
        <Link
          href={createCatalogFilterHref(
            currentParams,
            { page: safeCurrentPage + 1 },
            false,
          )}
          aria-label="Go to next page"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
