// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { Suspense } from 'react';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { parsePositiveInt } from '@/lib/list-filters';
import { formatMoney } from '@/lib/format';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { getProduct } from '@/features/catalog/api/get-product';
import { getProductInventory } from '@/features/catalog/api/get-product-inventory';
import { ProductAvailability } from '@/features/catalog/components/product-availability';
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

  const categoryHref =
    product.categoryName && product.categoryId
      ? (`/?categoryId=${product.categoryId}` as Route)
      : undefined;

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
