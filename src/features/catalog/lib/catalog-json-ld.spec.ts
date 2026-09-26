// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
  createBreadcrumbJsonLd,
  createProductJsonLd,
} from '@/features/catalog/lib/catalog-json-ld';
import type { ProductDetail } from '@/features/catalog/types';

describe('catalog-json-ld', () => {
  const sampleProduct: ProductDetail = {
    id: 42,
    name: 'Ergonomic Desk',
    slug: 'ergonomic-desk',
    description: 'A solid wood ergonomic desk.',
    price: 349.99,
    currency: 'USD',
    sku: 'DSK-001',
    imageUrl: 'https://images.test/desk.jpg',
    isActive: true,
    categoryId: 2,
    categoryName: 'Furniture',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const canonicalUrl = 'https://storefront.test/products/42';

  it('builds valid Product structured data with canonical URLs', () => {
    const jsonLd = createProductJsonLd(sampleProduct, canonicalUrl, true);

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd['@id']).toBe(canonicalUrl);
    expect(jsonLd.url).toBe(canonicalUrl);
    expect(jsonLd.name).toBe('Ergonomic Desk');
    expect(jsonLd.description).toBe('A solid wood ergonomic desk.');
    expect(jsonLd.sku).toBe('DSK-001');
    expect(jsonLd.image).toBe('https://images.test/desk.jpg');
    expect(jsonLd.offers).toEqual({
      '@type': 'Offer',
      url: canonicalUrl,
      price: 349.99,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    });
  });

  it('sets availability to OutOfStock when inventory is 0', () => {
    const jsonLd = createProductJsonLd(sampleProduct, canonicalUrl, false);
    expect(jsonLd.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('omits invalid or non-http image URLs from Product structured data', () => {
    const invalidProduct: ProductDetail = {
      ...sampleProduct,
      imageUrl: 'relative/path.jpg',
    };
    const jsonLd = createProductJsonLd(invalidProduct, canonicalUrl, true);
    expect(jsonLd.image).toBeUndefined();
  });

  it('builds valid BreadcrumbList structured data with position numbers and canonical item URLs', () => {
    const breadcrumbs = createBreadcrumbJsonLd([
      { name: 'Home', url: 'https://storefront.test/' },
      { name: 'Furniture', url: 'https://storefront.test/?categoryId=2' },
      { name: 'Ergonomic Desk', url: canonicalUrl },
    ]);

    expect(breadcrumbs['@context']).toBe('https://schema.org');
    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
    expect(breadcrumbs.itemListElement).toHaveLength(3);
    expect(breadcrumbs.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://storefront.test/',
    });
    expect(breadcrumbs.itemListElement[1]).toEqual({
      '@type': 'ListItem',
      position: 2,
      name: 'Furniture',
      item: 'https://storefront.test/?categoryId=2',
    });
    expect(breadcrumbs.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Ergonomic Desk',
      item: canonicalUrl,
    });
  });
});
