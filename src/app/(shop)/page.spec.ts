import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata } from '@/app/(shop)/page';
import * as getCategoriesModule from '@/features/catalog/api/get-categories';
import * as storefrontOriginModule from '@/lib/storefront-origin';
import type { Category } from '@/features/catalog/types';

describe('HomePage generateMetadata orchestration', () => {
  const origin = 'https://storefront.test';

  const sampleCategories: Category[] = [
    {
      id: 1,
      name: 'Apparel',
      slug: 'apparel',
      description: 'Clothing and apparel',
      isActive: true,
      productCount: 3,
    },
    {
      id: 2,
      name: 'Archived',
      slug: 'archived',
      description: 'Inactive items',
      isActive: false,
      productCount: 0,
    },
    {
      id: 3,
      name: 'Empty',
      slug: 'empty',
      description: 'No products yet',
      isActive: true,
      productCount: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(storefrontOriginModule, 'getStorefrontOrigin').mockReturnValue(
      origin,
    );
  });

  it('causes zero category API calls when no category parameter is present', async () => {
    const getCategoriesSpy = vi
      .spyOn(getCategoriesModule, 'getCategories')
      .mockResolvedValue(sampleCategories);

    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ page: '1' }),
    });

    expect(getCategoriesSpy).not.toHaveBeenCalled();
    expect(metadata.title).toBe('Browse Products');
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe('https://storefront.test/');
  });

  it('causes zero category API calls and omits canonical when category parameter is malformed', async () => {
    const getCategoriesSpy = vi
      .spyOn(getCategoriesModule, 'getCategories')
      .mockResolvedValue(sampleCategories);

    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ categoryId: 'abc' }),
    });

    expect(getCategoriesSpy).not.toHaveBeenCalled();
    expect(metadata.title).toBe('Category Not Found');
    expect(metadata.description).toBe(
      'The requested category could not be found.',
    );
    expect(metadata.robots).toEqual({ index: false, follow: true });
    // Crucial: canonical URL must be omitted, NOT canonicalized to /
    expect(metadata.alternates?.canonical).toBeUndefined();
  });

  it('queries categories and becomes nonexistent (noindex, follow) when category is not found or inactive', async () => {
    const getCategoriesSpy = vi
      .spyOn(getCategoriesModule, 'getCategories')
      .mockResolvedValue(sampleCategories);

    // Test nonexistent ID
    const metadataNotFound = await generateMetadata({
      searchParams: Promise.resolve({ categoryId: '999' }),
    });

    expect(getCategoriesSpy).toHaveBeenCalledTimes(1);
    expect(metadataNotFound.title).toBe('Category Not Found');
    expect(metadataNotFound.robots).toEqual({ index: false, follow: true });

    // Test inactive category
    const metadataInactive = await generateMetadata({
      searchParams: Promise.resolve({ categoryId: '2' }),
    });

    expect(metadataInactive.title).toBe('Category Not Found');
    expect(metadataInactive.robots).toEqual({ index: false, follow: true });
  });

  it('propagates category API failures unchanged without misclassifying as nonexistent', async () => {
    const apiError = new Error('Category service timeout');
    vi.spyOn(getCategoriesModule, 'getCategories').mockRejectedValue(apiError);

    await expect(
      generateMetadata({
        searchParams: Promise.resolve({ categoryId: '1' }),
      }),
    ).rejects.toThrow('Category service timeout');
  });

  it('marks empty category pages as noindex, follow while preserving self-canonical', async () => {
    vi.spyOn(getCategoriesModule, 'getCategories').mockResolvedValue(
      sampleCategories,
    );

    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ categoryId: '3' }),
    });

    expect(metadata.title).toBe('Empty');
    // Requirement 6: Do not index empty category pages
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(
      'https://storefront.test/?categoryId=3',
    );
  });

  it('resolves valid non-empty category with unique title, description, and indexable self-canonical', async () => {
    vi.spyOn(getCategoriesModule, 'getCategories').mockResolvedValue(
      sampleCategories,
    );

    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ categoryId: '1', page: '2' }),
    });

    expect(metadata.title).toBe('Apparel - Page 2');
    expect(metadata.description).toBe(
      'Browse our collection of Apparel products - Page 2.',
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe(
      'https://storefront.test/?categoryId=1&page=2',
    );
  });
});
