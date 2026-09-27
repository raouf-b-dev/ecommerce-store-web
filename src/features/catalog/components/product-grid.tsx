import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/empty-state';
import { ProductCard } from '@/features/catalog/components/product-card';
import type { ProductListItem } from '@/features/catalog/types';

type ProductGridProps = {
  products: ProductListItem[];
  hasActiveFilters: boolean;
};

function CatalogSearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function ProductGrid({ products, hasActiveFilters }: ProductGridProps) {
  if (products.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          className="p-12"
          icon={<CatalogSearchIcon />}
          title="No products found"
          description="We couldn&apos;t find any products matching your current filters. Try adjusting your search or clear your filters to see more results."
        >
          <Button asChild variant="outline" size="sm">
            <Link href="/">Clear all filters</Link>
          </Button>
        </EmptyState>
      );
    }

    return (
      <EmptyState
        className="p-12"
        title="No products yet"
        description="The catalog is empty for now. Check back soon to browse and make your first purchase."
      />
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
