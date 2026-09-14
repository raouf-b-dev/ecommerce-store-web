import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parsePositiveInt } from '@/lib/list-filters';
import { formatMoney } from '@/lib/format';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { getProduct } from '@/features/catalog/api/get-product';
import { getProductInventory } from '@/features/catalog/api/get-product-inventory';
import { ProductImage } from '@/features/catalog/components/product-image';
import { ProductAvailability } from '@/features/catalog/components/product-availability';
import { AddToCartCta } from '@/features/cart/components/add-to-cart-cta';
import type { ProductDetail } from '@/features/catalog/types';

import { createPageMetadata, type PageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import {
  createBreadcrumbJsonLd,
  createProductJsonLd,
  type BreadcrumbItem,
} from '@/features/catalog/lib/catalog-json-ld';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Opt this route out of Cache Components instant shells so missing products can
 * emit a genuine HTTP 404 before the response streams.
 */
export const instant = false;

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<PageMetadata> {
  const resolvedParams = await params;
  const productId = parsePositiveInt(resolvedParams.id);

  if (!productId) {
    notFound();
  }

  const product = await getProduct(productId);
  if (!product) {
    notFound();
  }

  const origin = getStorefrontOrigin();
  const canonicalUrl = `${origin}/products/${product.id}`;

  return createPageMetadata({
    title: product.name,
    description:
      product.description?.trim() ||
      `Buy ${product.name} at the storefront for ${formatMoney(product.price, product.currency)}.`,
    canonicalUrl,
    origin,
    imageUrl: product.imageUrl,
    imageAlt: product.name,
    openGraphType: 'website',
  });
}

async function ProductJsonLd({
  product,
  canonicalUrl,
}: {
  product: ProductDetail;
  canonicalUrl: string;
}) {
  const inventory = await getProductInventory(product.id);
  const isAvailable = (inventory?.availableQuantity ?? 0) > 0;

  return (
    <JsonLd data={createProductJsonLd(product, canonicalUrl, isAvailable)} />
  );
}

async function ProductAvailabilitySlot({ productId }: { productId: number }) {
  const inventory = await getProductInventory(productId);
  return <ProductAvailability inventory={inventory} />;
}

async function AddToCartSlot({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const inventory = await getProductInventory(productId);
  const isAvailable = (inventory?.availableQuantity ?? 0) > 0;
  return (
    <AddToCartCta
      productId={productId}
      productName={productName}
      isAvailable={isAvailable}
      availableQuantity={inventory?.availableQuantity ?? 0}
    />
  );
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const productId = parsePositiveInt(resolvedParams.id);

  if (!productId) {
    notFound();
  }

  // Resolve existence before any Suspense boundary so notFound() can set HTTP 404.
  const product = await getProduct(productId);
  if (!product) {
    notFound();
  }

  const origin = getStorefrontOrigin();
  const canonicalUrl = `${origin}/products/${product.id}`;

  const breadcrumbItems: BreadcrumbItem[] = [{ name: 'Home', url: `${origin}/` }];
  if (product.categoryName && product.categoryId) {
    breadcrumbItems.push({
      name: product.categoryName,
      url: `${origin}/?categoryId=${product.categoryId}`,
    });
  }
  breadcrumbItems.push({
    name: product.name,
    url: canonicalUrl,
  });

  return (
    <article className="space-y-8">
      <JsonLd data={createBreadcrumbJsonLd(breadcrumbItems)} />
      <Suspense fallback={null}>
        <ProductJsonLd product={product} canonicalUrl={canonicalUrl} />
      </Suspense>

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
          {product.categoryName && product.categoryId ? (
            <>
              <li>
                <Link
                  href={`/?categoryId=${product.categoryId}`}
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
              <Suspense
                fallback={
                  <span
                    className="text-xs text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    Checking availability…
                  </span>
                }
              >
                <ProductAvailabilitySlot productId={product.id} />
              </Suspense>
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

          <div className="border-t pt-6">
            <Suspense
              fallback={
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              }
            >
              <AddToCartSlot
                productId={product.id}
                productName={product.name}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </article>
  );
}
