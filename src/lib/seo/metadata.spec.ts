// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { createPageMetadata } from '@/lib/seo/metadata';
import { NO_INDEX_ROBOTS } from '@/lib/seo/config';

describe('createPageMetadata', () => {
  it('creates basic metadata without duplicating brand template and defaults to website type', () => {
    const meta = createPageMetadata({
      title: 'Browse Products',
      description: 'Find products here.',
    });

    expect(meta.title).toBe('Browse Products');
    expect(meta.description).toBe('Find products here.');
    expect(meta.openGraph?.type).toBe('website');
    expect(meta.openGraph?.title).toBe('Browse Products');
    expect(meta.twitter?.title).toBe('Browse Products');
  });

  it('sets canonical alternate when canonicalUrl is provided', () => {
    const meta = createPageMetadata({
      title: 'Shoes',
      canonicalUrl: 'https://storefront.test/products/1',
    });

    expect(meta.alternates?.canonical).toBe(
      'https://storefront.test/products/1',
    );
    expect(meta.openGraph?.url).toBe('https://storefront.test/products/1');
  });

  it('respects custom robots directives', () => {
    const meta = createPageMetadata({
      title: 'Private',
      robots: NO_INDEX_ROBOTS,
    });

    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it('uses supplied valid absolute HTTP(S) imageUrl for Open Graph and Twitter cards', () => {
    const meta = createPageMetadata({
      title: 'T-Shirt',
      imageUrl: 'https://cdn.test/shirt.jpg',
      imageAlt: 'Cotton T-Shirt',
    });

    expect(meta.openGraph?.images).toEqual([
      { url: 'https://cdn.test/shirt.jpg', alt: 'Cotton T-Shirt' },
    ]);
    expect(meta.twitter?.images).toEqual(['https://cdn.test/shirt.jpg']);
  });

  it('rejects invalid image URLs and falls back to full social image metadata', () => {
    const meta = createPageMetadata({
      title: 'Desk',
      imageUrl: 'not-a-valid-url',
      origin: 'https://storefront.test',
      imageAlt: 'Desk Image',
    });

    expect(meta.openGraph?.images).toEqual([
      {
        url: 'https://storefront.test/opengraph-image',
        alt: 'Desk Image',
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ]);
    expect(meta.twitter?.images).toEqual([
      'https://storefront.test/twitter-image',
    ]);
  });

  it('preserves complete fallback social-image dimensions and MIME type when no image is provided', () => {
    const meta = createPageMetadata({
      title: 'Storefront',
      origin: 'https://storefront.test',
    });

    expect(meta.openGraph?.images).toEqual([
      {
        url: 'https://storefront.test/opengraph-image',
        alt: 'Storefront',
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ]);
    expect(meta.twitter?.images).toEqual([
      'https://storefront.test/twitter-image',
    ]);
  });
});
