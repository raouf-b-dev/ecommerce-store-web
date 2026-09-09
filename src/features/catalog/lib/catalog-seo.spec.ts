import { describe, expect, it } from 'vitest';
import {
  buildCatalogCanonicalUrl,
  buildCatalogMetadata,
  isCatalogFacetedVariant,
  isCategoryIdMalformed,
  type CatalogCategoryState,
} from '@/features/catalog/lib/catalog-seo';
import type { CatalogFilterParams, Category } from '@/features/catalog/types';

describe('catalog-seo', () => {
  const origin = 'https://storefront.test';

  const defaultParams: CatalogFilterParams = {
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const sampleCategory: Category = {
    id: 3,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Gadgets and devices',
    isActive: true,
  };

  describe('isCategoryIdMalformed', () => {
    it('returns false when categoryId is omitted', () => {
      expect(isCategoryIdMalformed(undefined)).toBe(false);
    });

    it('returns false for valid positive integer string', () => {
      expect(isCategoryIdMalformed('3')).toBe(false);
      expect(isCategoryIdMalformed(['12'])).toBe(false);
    });

    it('returns true for non-numeric or negative or zero inputs', () => {
      expect(isCategoryIdMalformed('abc')).toBe(true);
      expect(isCategoryIdMalformed('-1')).toBe(true);
      expect(isCategoryIdMalformed('0')).toBe(true);
      expect(isCategoryIdMalformed('')).toBe(true);
      expect(isCategoryIdMalformed(['   '])).toBe(true);
      expect(isCategoryIdMalformed(['xyz'])).toBe(true);
    });
  });

  describe('isCatalogFacetedVariant', () => {
    it('returns false for default catalog parameters', () => {
      expect(isCatalogFacetedVariant(defaultParams)).toBe(false);
    });

    it('returns false for category and pagination changes without facets', () => {
      expect(
        isCatalogFacetedVariant({
          ...defaultParams,
          categoryId: 3,
          page: 2,
        }),
      ).toBe(false);
    });

    it('returns true when search is active', () => {
      expect(
        isCatalogFacetedVariant({
          ...defaultParams,
          search: 'laptop',
        }),
      ).toBe(true);
    });

    it('returns true when price filters are active', () => {
      expect(
        isCatalogFacetedVariant({
          ...defaultParams,
          minPrice: 10,
        }),
      ).toBe(true);
      expect(
        isCatalogFacetedVariant({
          ...defaultParams,
          maxPrice: 100,
        }),
      ).toBe(true);
    });

    it('returns true when custom sort or sortOrder is active', () => {
      expect(
        isCatalogFacetedVariant({
          ...defaultParams,
          sortBy: 'price',
        }),
      ).toBe(true);
      expect(
        isCatalogFacetedVariant({
          ...defaultParams,
          sortOrder: 'asc',
        }),
      ).toBe(true);
    });

    it('returns true when custom limit is active', () => {
      expect(
        isCatalogFacetedVariant({
          ...defaultParams,
          limit: 24,
        }),
      ).toBe(true);
    });
  });

  describe('buildCatalogCanonicalUrl', () => {
    it('omits all defaults for root catalog', () => {
      expect(buildCatalogCanonicalUrl(origin, defaultParams)).toBe(
        'https://storefront.test/',
      );
    });

    it('builds clean self-canonical for paginated root', () => {
      expect(
        buildCatalogCanonicalUrl(origin, {
          ...defaultParams,
          page: 2,
        }),
      ).toBe('https://storefront.test/?page=2');
    });

    it('builds clean self-canonical for category page', () => {
      expect(
        buildCatalogCanonicalUrl(origin, {
          ...defaultParams,
          categoryId: 5,
        }),
      ).toBe('https://storefront.test/?categoryId=5');
    });

    it('builds clean self-canonical for category page with pagination', () => {
      expect(
        buildCatalogCanonicalUrl(origin, {
          ...defaultParams,
          categoryId: 5,
          page: 3,
        }),
      ).toBe('https://storefront.test/?categoryId=5&page=3');
    });

    it('builds normalized self-canonical for faceted search and never collapses to root', () => {
      expect(
        buildCatalogCanonicalUrl(origin, {
          ...defaultParams,
          search: 'shoes',
          page: 2,
        }),
      ).toBe('https://storefront.test/?page=2&search=shoes');
    });

    it('builds normalized self-canonical for price filter and sort', () => {
      expect(
        buildCatalogCanonicalUrl(origin, {
          ...defaultParams,
          minPrice: 15,
          maxPrice: 50,
          sortBy: 'price',
          sortOrder: 'asc',
        }),
      ).toBe(
        'https://storefront.test/?maxPrice=50&minPrice=15&sortBy=price&sortOrder=asc',
      );
    });
  });

  describe('buildCatalogMetadata', () => {
    it('creates indexable metadata for root homepage', () => {
      const state: CatalogCategoryState = { status: 'none' };
      const meta = buildCatalogMetadata({
        origin,
        params: defaultParams,
        categoryState: state,
      });

      expect(meta.title).toBe('Browse Products');
      expect(meta.description).toBe('Explore our catalog of high quality products.');
      expect(meta.robots).toEqual({ index: true, follow: true });
      expect(meta.alternates?.canonical).toBe('https://storefront.test/');
    });

    it('creates unique title and description for root pagination', () => {
      const state: CatalogCategoryState = { status: 'none' };
      const meta = buildCatalogMetadata({
        origin,
        params: { ...defaultParams, page: 2 },
        categoryState: state,
      });

      expect(meta.title).toBe('Browse Products - Page 2');
      expect(meta.description).toBe(
        'Explore our catalog of high quality products - Page 2.',
      );
      expect(meta.robots).toEqual({ index: true, follow: true });
      expect(meta.alternates?.canonical).toBe('https://storefront.test/?page=2');
    });

    it('creates indexable metadata with unique title and description for valid category', () => {
      const state: CatalogCategoryState = {
        status: 'valid',
        category: sampleCategory,
        hasProducts: true,
      };
      const meta = buildCatalogMetadata({
        origin,
        params: { ...defaultParams, categoryId: 3 },
        categoryState: state,
      });

      expect(meta.title).toBe('Electronics');
      expect(meta.description).toBe('Browse our collection of Electronics products.');
      expect(meta.robots).toEqual({ index: true, follow: true });
      expect(meta.alternates?.canonical).toBe(
        'https://storefront.test/?categoryId=3',
      );
    });

    it('creates unique title and description for valid category pagination', () => {
      const state: CatalogCategoryState = {
        status: 'valid',
        category: sampleCategory,
        hasProducts: true,
      };
      const meta = buildCatalogMetadata({
        origin,
        params: { ...defaultParams, categoryId: 3, page: 4 },
        categoryState: state,
      });

      expect(meta.title).toBe('Electronics - Page 4');
      expect(meta.description).toBe(
        'Browse our collection of Electronics products - Page 4.',
      );
      expect(meta.robots).toEqual({ index: true, follow: true });
      expect(meta.alternates?.canonical).toBe(
        'https://storefront.test/?categoryId=3&page=4',
      );
    });

    it('marks valid category with hasProducts === false as noindex, follow', () => {
      const state: CatalogCategoryState = {
        status: 'valid',
        category: sampleCategory,
        hasProducts: false,
      };
      const meta = buildCatalogMetadata({
        origin,
        params: { ...defaultParams, categoryId: 3 },
        categoryState: state,
      });

      expect(meta.title).toBe('Electronics');
      expect(meta.description).toBe(
        'Browse our collection of Electronics products.',
      );
      // Empty category must be noindex, follow with self-canonical
      expect(meta.robots).toEqual({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBe(
        'https://storefront.test/?categoryId=3',
      );
    });

    it('marks search query as noindex, follow with custom search title', () => {
      const state: CatalogCategoryState = { status: 'none' };
      const meta = buildCatalogMetadata({
        origin,
        params: { ...defaultParams, search: 'Keyboard' },
        categoryState: state,
      });

      expect(meta.title).toBe('Search: "Keyboard"');
      expect(meta.robots).toEqual({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBe(
        'https://storefront.test/?search=Keyboard',
      );
    });

    it('marks malformed category parameter as noindex, follow and omits canonical', () => {
      const state: CatalogCategoryState = { status: 'malformed' };
      const meta = buildCatalogMetadata({
        origin,
        params: defaultParams,
        categoryState: state,
      });

      expect(meta.title).toBe('Category Not Found');
      expect(meta.description).toBe('The requested category could not be found.');
      expect(meta.robots).toEqual({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBeUndefined();
    });

    it('marks nonexistent category parameter as noindex, follow', () => {
      const state: CatalogCategoryState = { status: 'nonexistent' };
      const meta = buildCatalogMetadata({
        origin,
        params: { ...defaultParams, categoryId: 9999 },
        categoryState: state,
      });

      expect(meta.title).toBe('Category Not Found');
      expect(meta.description).toBe('The requested category could not be found.');
      expect(meta.robots).toEqual({ index: false, follow: true });
    });
  });
});
