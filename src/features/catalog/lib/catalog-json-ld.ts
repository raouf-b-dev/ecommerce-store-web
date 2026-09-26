// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { ProductDetail } from '@/features/catalog/types';
import { isValidAbsoluteHttpUrl } from '@/lib/seo/image-url';

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export function createProductJsonLd(
  product: ProductDetail,
  canonicalUrl: string,
  isAvailable: boolean,
) {
  const validImage = isValidAbsoluteHttpUrl(product.imageUrl)
    ? product.imageUrl.trim()
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: product.name,
    description: product.description ?? undefined,
    image: validImage,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      price: product.price,
      priceCurrency: product.currency,
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}
