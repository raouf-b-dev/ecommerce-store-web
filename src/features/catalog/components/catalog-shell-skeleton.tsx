// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

export function CatalogShellSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading products...</span>

      {/* Decorative skeleton layout */}
      <div aria-hidden="true" className="space-y-6">
        {/* Category pills skeleton */}
        <div className="flex items-center gap-2 overflow-hidden pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-muted/60"
            />
          ))}
        </div>

        {/* Filter bar skeleton */}
        <div className="h-28 w-full animate-pulse rounded-xl border bg-muted/30" />

        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-xl border bg-card p-0 shadow-xs"
            >
              <div className="aspect-square w-full animate-pulse bg-muted/50" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
