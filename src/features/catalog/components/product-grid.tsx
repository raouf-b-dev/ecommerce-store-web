import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/features/catalog/components/product-card';
import type { ProductListItem } from '@/features/catalog/types';

type ProductGridProps = {
  products: ProductListItem[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">
          No products found
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t find any products matching your current filters. Try
          adjusting your search or clear your filters to see more results.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Clear all filters</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
