import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  MAX_LIMIT,
  buildCatalogQueryString,
  createCatalogFilterHref,
  parseCatalogSearchParams,
  toCatalogCacheKey,
  toProductsQueryParams,
} from '@/features/catalog/lib/catalog-params';

describe('catalog-params', () => {
  describe('parseCatalogSearchParams', () => {
    it('returns defaults for empty search params', () => {
      const parsed = parseCatalogSearchParams({});

      expect(parsed).toEqual({
        search: undefined,
        categoryId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: DEFAULT_SORT_BY,
        sortOrder: DEFAULT_SORT_ORDER,
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
      });
    });

    it('parses valid search, category, price and sort params', () => {
      const parsed = parseCatalogSearchParams({
        search: '  wireless headphones  ',
        categoryId: '3',
        minPrice: '10.5',
        maxPrice: '99.99',
        sortBy: 'price',
        sortOrder: 'asc',
        page: '2',
        limit: '24',
      });

      expect(parsed).toEqual({
        search: 'wireless headphones',
        categoryId: 3,
        minPrice: 10.5,
        maxPrice: 99.99,
        sortBy: 'price',
        sortOrder: 'asc',
        page: 2,
        limit: 24,
      });
    });

    it('takes the first item when param is an array', () => {
      const parsed = parseCatalogSearchParams({
        search: ['first', 'second'],
        categoryId: ['5', '10'],
        sortBy: ['name', 'price'],
      });

      expect(parsed.search).toBe('first');
      expect(parsed.categoryId).toBe(5);
      expect(parsed.sortBy).toBe('name');
    });

    it('clamps limit to MAX_LIMIT (100)', () => {
      const parsed = parseCatalogSearchParams({ limit: '250' });
      expect(parsed.limit).toBe(MAX_LIMIT);
    });

    it('falls back to default page on 0 or negative page numbers', () => {
      expect(parseCatalogSearchParams({ page: '0' }).page).toBe(1);
      expect(parseCatalogSearchParams({ page: '-5' }).page).toBe(1);
      expect(parseCatalogSearchParams({ page: 'abc' }).page).toBe(1);
    });

    it('drops both prices if minPrice > maxPrice', () => {
      const parsed = parseCatalogSearchParams({
        minPrice: '100',
        maxPrice: '50',
      });

      expect(parsed.minPrice).toBeUndefined();
      expect(parsed.maxPrice).toBeUndefined();
    });

    it('treats empty or whitespace-only price strings as undefined', () => {
      const parsed = parseCatalogSearchParams({
        minPrice: '',
        maxPrice: '   ',
      });

      expect(parsed.minPrice).toBeUndefined();
      expect(parsed.maxPrice).toBeUndefined();
    });

    it('falls back to default sort if sortBy or sortOrder is invalid', () => {
      const parsed = parseCatalogSearchParams({
        sortBy: 'invalid_col',
        sortOrder: 'invalid_dir',
      });

      expect(parsed.sortBy).toBe(DEFAULT_SORT_BY);
      expect(parsed.sortOrder).toBe(DEFAULT_SORT_ORDER);
    });
  });

  describe('toProductsQueryParams', () => {
    it('produces clean OpenAPI query object omitting undefined values', () => {
      const parsed = parseCatalogSearchParams({
        search: 'laptop',
        page: '1',
      });

      const query = toProductsQueryParams(parsed);

      expect(query).toEqual({
        page: 1,
        limit: DEFAULT_LIMIT,
        search: 'laptop',
        sortBy: DEFAULT_SORT_BY,
        sortOrder: DEFAULT_SORT_ORDER,
      });
    });
  });

  describe('buildCatalogQueryString and createCatalogFilterHref', () => {
    it('omits defaults from query string', () => {
      const base = parseCatalogSearchParams({});
      expect(buildCatalogQueryString(base)).toBe('');
      expect(createCatalogFilterHref(base, {})).toBe('/');
    });

    it('preserves other filters when changing category and resets page to 1', () => {
      const current = parseCatalogSearchParams({
        search: 'keyboard',
        minPrice: '20',
        maxPrice: '80',
        sortBy: 'price',
        sortOrder: 'asc',
        page: '3',
      });

      const href = createCatalogFilterHref(current, { categoryId: 4 });

      expect(href).toContain('categoryId=4');
      expect(href).toContain('search=keyboard');
      expect(href).toContain('minPrice=20');
      expect(href).toContain('maxPrice=80');
      expect(href).toContain('sortBy=price');
      expect(href).toContain('sortOrder=asc');
      expect(href).not.toContain('page=3');
    });

    it('preserves page when navigating pagination links', () => {
      const current = parseCatalogSearchParams({
        search: 'keyboard',
        page: '1',
      });

      const href = createCatalogFilterHref(current, { page: 2 }, false);

      expect(href).toContain('page=2');
      expect(href).toContain('search=keyboard');
    });
  });

  describe('toCatalogCacheKey', () => {
    it('is stable for equal filters built from different object identities', () => {
      const a = parseCatalogSearchParams({
        search: 'laptop',
        categoryId: '2',
        page: '1',
        limit: '12',
        sortBy: 'price',
        sortOrder: 'asc',
      });
      const b = { ...a };

      expect(toCatalogCacheKey(a)).toBe(toCatalogCacheKey(b));
      expect(JSON.parse(toCatalogCacheKey(a))).toEqual(
        toProductsQueryParams(a),
      );
    });

    it('changes when a filter that affects the API query changes', () => {
      const base = parseCatalogSearchParams({ categoryId: '2', page: '1' });
      const nextPage = { ...base, page: 2 };

      expect(toCatalogCacheKey(base)).not.toBe(toCatalogCacheKey(nextPage));
    });
  });
});
