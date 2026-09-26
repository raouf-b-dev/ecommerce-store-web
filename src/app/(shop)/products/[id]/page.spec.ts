// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata } from '@/app/(shop)/products/[id]/page';
import * as getProductModule from '@/features/catalog/api/get-product';
import * as storefrontOriginModule from '@/lib/storefront-origin';
import type * as NextNavigation from 'next/navigation';
import type { ProductDetail } from '@/features/catalog/types';

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
  }),
);

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof NextNavigation>();
  return {
    ...actual,
    notFound: notFoundMock,
  };
});

describe('ProductDetailPage generateMetadata', () => {
  const origin = 'https://storefront.test';

  const activeProduct: ProductDetail = {
    id: 10,
    name: 'Wireless Mechanical Keyboard',
    slug: 'wireless-mechanical-keyboard',
    description: 'A premium tactile mechanical keyboard.',
    price: 129.99,
    currency: 'USD',
    sku: 'KB-001',
    imageUrl: 'https://cdn.test/keyboard.jpg',
    isActive: true,
    categoryId: 5,
    categoryName: 'Peripherals',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(storefrontOriginModule, 'getStorefrontOrigin').mockReturnValue(
      origin,
    );
  });

  it('emits website Open Graph type, canonical URL, and valid image for active product', async () => {
    vi.spyOn(getProductModule, 'getProduct').mockResolvedValue(activeProduct);

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: '10' }),
    });

    expect(metadata.title).toBe('Wireless Mechanical Keyboard');
    expect(metadata.description).toBe('A premium tactile mechanical keyboard.');
    expect(metadata.alternates?.canonical).toBe(
      'https://storefront.test/products/10',
    );

    expect(metadata.openGraph?.type).toBe('website');
    expect(metadata.openGraph?.url).toBe('https://storefront.test/products/10');

    expect(metadata.openGraph?.images).toEqual([
      {
        url: 'https://cdn.test/keyboard.jpg',
        alt: 'Wireless Mechanical Keyboard',
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      'https://cdn.test/keyboard.jpg',
    ]);
  });

  it('falls back to complete social fallback image when product imageUrl is invalid or relative', async () => {
    vi.spyOn(getProductModule, 'getProduct').mockResolvedValue({
      ...activeProduct,
      imageUrl: '/relative/keyboard.png',
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: '10' }),
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: 'https://storefront.test/opengraph-image',
        alt: 'Wireless Mechanical Keyboard',
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      'https://storefront.test/twitter-image',
    ]);
  });

  it('calls notFound for non-positive or malformed ID', async () => {
    const getProductSpy = vi.spyOn(getProductModule, 'getProduct');

    await expect(
      generateMetadata({
        params: Promise.resolve({ id: 'abc' }),
      }),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');

    expect(getProductSpy).not.toHaveBeenCalled();
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it('calls notFound when product is missing', async () => {
    vi.spyOn(getProductModule, 'getProduct').mockResolvedValue(null);

    await expect(
      generateMetadata({
        params: Promise.resolve({ id: '999' }),
      }),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');

    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
