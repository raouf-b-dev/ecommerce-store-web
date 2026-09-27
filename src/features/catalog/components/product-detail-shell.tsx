import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { formatMoney } from '@/lib/format';
import { ProductImage } from '@/components/media/product-image';
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
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted/20 shadow-xs">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {product.categoryName ? (
            <span className="inline-flex rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
              {product.categoryName}
            </span>
          ) : null}

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>

          <p className="text-xs text-muted-foreground">
            SKU: <span className="font-mono">{product.sku}</span>
          </p>

          <div className="flex items-baseline gap-4 pt-2">
            <span className="text-3xl font-extrabold text-foreground">
              {formatMoney(product.price, product.currency)}
            </span>
            {availabilitySlot}
          </div>

          {product.description ? (
            <div className="pt-4 text-sm leading-relaxed text-muted-foreground">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                Description
              </h2>
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          ) : null}
        </div>

        <div className="border-t pt-6">{actionSlot}</div>
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
