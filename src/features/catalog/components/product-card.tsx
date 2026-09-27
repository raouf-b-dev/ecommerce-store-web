import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import { ProductImageFrame } from '@/components/media/product-image';
import type { ProductListItem } from '@/features/catalog/types';

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative">
        <ProductImageFrame
          src={product.imageUrl}
          alt=""
          name={product.name}
          categoryId={product.categoryId}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="w-full rounded-none"
          imageClassName="group-hover:scale-105"
        />
        {product.categoryName ? (
          <span className="absolute top-2.5 left-2.5 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-xs shadow-xs">
            {product.categoryName}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <h3 className="line-clamp-2 text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <p className="mt-2 text-base font-bold text-foreground">
          {formatMoney(product.price, product.currency)}
        </p>
      </div>
    </Link>
  );
}
