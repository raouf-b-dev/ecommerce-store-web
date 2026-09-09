import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata } from '@/app/(shop)/products/[id]/page';
import * as getProductModule from '@/features/catalog/api/get-product';
import * as storefrontOriginModule from '@/lib/storefront-origin';
import type { ProductDetail } from '@/features/catalog/types';

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

    // Requirement 5: Open Graph type must be 'website', NOT 'article'
    expect(metadata.openGraph?.type).toBe('website');
    expect(metadata.openGraph?.url).toBe('https://storefront.test/products/10');

    // Requirement 7: Valid image URL is emitted
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

    // Fallback image preserves dimensions and MIME type
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

  it('returns Product Not Found for non-positive or malformed ID', async () => {
    const getProductSpy = vi.spyOn(getProductModule, 'getProduct');

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'abc' }),
    });

    expect(getProductSpy).not.toHaveBeenCalled();
    expect(metadata.title).toBe('Product Not Found');
  });

  it('returns Product Not Found when product is missing or inactive', async () => {
    vi.spyOn(getProductModule, 'getProduct').mockResolvedValue(null);

    const notFoundMeta = await generateMetadata({
      params: Promise.resolve({ id: '999' }),
    });
    expect(notFoundMeta.title).toBe('Product Not Found');

    vi.spyOn(getProductModule, 'getProduct').mockResolvedValue({
      ...activeProduct,
      isActive: false,
    });

    const inactiveMeta = await generateMetadata({
      params: Promise.resolve({ id: '10' }),
    });
    expect(inactiveMeta.title).toBe('Product Not Found');
  });
});
