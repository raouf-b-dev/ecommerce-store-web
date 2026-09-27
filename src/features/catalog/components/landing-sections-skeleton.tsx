export function LandingSectionsSkeleton() {
  return (
    <div className="space-y-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading categories and new arrivals...</span>

      {/* Decorative skeleton layout */}
      <div aria-hidden="true" className="space-y-14">
        <div className="space-y-4">
          <div className="h-7 w-44 animate-pulse rounded-md bg-muted/60" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border bg-card shadow-xs"
              >
                <div className="aspect-square w-full animate-pulse bg-muted/50" />
                <div className="p-3">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-7 w-36 animate-pulse rounded-md bg-muted/60" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border bg-card shadow-xs"
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
    </div>
  );
}
