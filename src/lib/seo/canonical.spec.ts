import { describe, expect, it } from 'vitest';
import { buildCanonicalUrl } from '@/lib/seo/canonical';

describe('buildCanonicalUrl', () => {
  const origin = 'https://storefront.test';

  it('builds canonical URL with origin and path without query params', () => {
    expect(buildCanonicalUrl(origin, '/')).toBe('https://storefront.test/');
    expect(buildCanonicalUrl(origin, '/products/42')).toBe(
      'https://storefront.test/products/42',
    );
  });

  it('handles origin with trailing slash and path without leading slash', () => {
    expect(buildCanonicalUrl('https://storefront.test/', 'products/1')).toBe(
      'https://storefront.test/products/1',
    );
  });

  it('sorts query parameters alphabetically', () => {
    const url1 = buildCanonicalUrl(origin, '/', {
      page: 2,
      categoryId: 5,
    });
    const url2 = buildCanonicalUrl(origin, '/', {
      categoryId: 5,
      page: 2,
    });
    expect(url1).toBe('https://storefront.test/?categoryId=5&page=2');
    expect(url2).toBe('https://storefront.test/?categoryId=5&page=2');
  });

  it('omits undefined, null, and empty string parameters', () => {
    const url = buildCanonicalUrl(origin, '/', {
      search: '',
      categoryId: 3,
      minPrice: undefined,
      maxPrice: null,
      page: 2,
    });
    expect(url).toBe('https://storefront.test/?categoryId=3&page=2');
  });

  it('returns clean path when all parameters are omitted or empty', () => {
    const url = buildCanonicalUrl(origin, '/', {
      search: '',
      minPrice: undefined,
      maxPrice: null,
    });
    expect(url).toBe('https://storefront.test/');
  });
});
