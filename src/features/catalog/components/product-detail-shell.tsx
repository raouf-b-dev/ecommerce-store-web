import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { formatMoney } from '@/lib/format';
import { ProductImageFrame } from '@/components/media/product-image';
import type { ProductDetail } from '@/features/catalog/types';

type ProductDetailShellProps = {
  product: ProductDetail;
  availabilitySlot: ReactNode;
  /** Cart CTA or other purchase actions - composed by the route, not by catalog. */
  actionSlot: ReactNode;
};

/**
 * Catalog presentational shell for product detail. Does not import cart.
 * The route supplies availability and action slots.
 */
export function ProductDetailShell({
  product,
  availabilitySlot,
  actionSlot,
}: ProductDetailShellProps) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
      <ProductImageFrame
        src={product.imageUrl}
        alt={product.name}
        name={product.name}
        categoryId={product.categoryId}
        priority
        sizes="(min-width: 768px) 58vw, 100vw"
        className="w-full rounded-2xl border shadow-xs md:col-span-7"
      />

      <div className="space-y-6 md:sticky md:top-8 md:col-span-5 md:self-start">
        <div className="space-y-3">
          {product.categoryName ? (
            <p className="text-sm font-medium text-primary">
              {product.categoryName}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-semibold text-foreground">
            {formatMoney(product.price, product.currency)}
          </p>
          {availabilitySlot}
        </div>

        <div>{actionSlot}</div>

        {product.description ? (
          <div className="space-y-2 border-t pt-6">
            <h2 className="text-sm font-semibold text-foreground">
              About this item
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          SKU <span className="font-mono">{product.sku}</span>
        </p>
      </div>
    </div>
  );
}

export function ProductBreadcrumbs({
  product,
  categoryHref,
}: {
  product: ProductDetail;
  categoryHref?: Route;
}) {
  return (
    <nav aria-label="Breadcrumbs" className="text-xs text-muted-foreground">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link
            href="/"
            className="transition-colors hover:text-foreground hover:underline"
          >
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        {product.categoryName && categoryHref ? (
          <>
            <li>
              <Link
                href={categoryHref}
                className="transition-colors hover:text-foreground hover:underline"
              >
                {product.categoryName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
          </>
        ) : null}
        <li
          aria-current="page"
          className="line-clamp-1 font-medium text-foreground"
        >
          {product.name}
        </li>
      </ol>
    </nav>
  );
}
