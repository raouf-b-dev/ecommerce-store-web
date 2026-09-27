import Link from 'next/link';
import { ProductCard } from '@/features/catalog/components/product-card';
import { CATALOG_PATH } from '@/features/catalog/lib/catalog-params';
import type { ProductListItem } from '@/features/catalog/types';

type NewArrivalsProps = {
  products: ProductListItem[];
};

export function NewArrivals({ products }: NewArrivalsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="new-arrivals-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="new-arrivals-heading"
          className="text-xl font-semibold tracking-tight"
        >
          New arrivals
        </h2>
        <Link
          href={CATALOG_PATH}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          See everything
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
