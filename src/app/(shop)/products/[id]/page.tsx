import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { parsePositiveInt } from '@/lib/list-filters';
import { formatMoney } from '@/lib/format';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { getProduct } from '@/features/catalog/api/get-product';
import { getProductInventory } from '@/features/catalog/api/get-product-inventory';
import { ProductAvailability } from '@/features/catalog/components/product-availability';
import { catalogHref } from '@/features/catalog/lib/catalog-params';
import {
  ProductBreadcrumbs,
  ProductDetailShell,
} from '@/features/catalog/components/product-detail-shell';
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
 * The product lookup blocks outside Suspense on purpose, so this segment opts out
 * of instant-navigation validation. It does not change the HTTP status: the static
 * shell streams as 200 first, and a missing product is a soft 404 that Next.js marks
 * `noindex` (ADR-0009).
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
  const isAvailable = Boolean(
    inventory?.isAvailable || (inventory?.availableQuantity ?? 0) > 0,
  );

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
  const isAvailable = Boolean(
    inventory?.isAvailable || (inventory?.availableQuantity ?? 0) > 0,
  );
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

  // Resolve existence before any page-level Suspense boundary so the not-found UI
  // replaces the whole page instead of streaming into a partial layout.
  const product = await getProduct(productId);
  if (!product) {
    notFound();
  }

  const origin = getStorefrontOrigin();
  const canonicalUrl = `${origin}/products/${product.id}`;

  const categoryHref =
    product.categoryName && product.categoryId
      ? catalogHref({ categoryId: product.categoryId })
      : undefined;

  const breadcrumbItems: BreadcrumbItem[] = [{ name: 'Home', url: `${origin}/` }];
  if (product.categoryName && categoryHref) {
    breadcrumbItems.push({
      name: product.categoryName,
      url: `${origin}${categoryHref}`,
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

      <ProductBreadcrumbs product={product} categoryHref={categoryHref} />

      <ProductDetailShell
        product={product}
        availabilitySlot={
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
        }
        actionSlot={
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
        }
      />
    </article>
  );
}
