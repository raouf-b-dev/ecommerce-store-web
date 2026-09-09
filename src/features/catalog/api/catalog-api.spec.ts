import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@/lib/api/server-client', () => ({
  serverClient: {
    GET: mocks.get,
  },
}));

import { getProducts } from '@/features/catalog/api/get-products';
import { getProduct } from '@/features/catalog/api/get-product';
import { getCategories } from '@/features/catalog/api/get-categories';
import { getProductInventory } from '@/features/catalog/api/get-product-inventory';
import {
  createMockCategory,
  createMockInventory,
  createMockPaginatedProducts,
  createMockProductDetail,
} from '@/test/fixtures/catalog.fixture';
import {
  createErrorApiResponse,
  createSuccessApiResponse,
} from '@/test/fixtures/api-response.fixture';

describe('catalog-api fetchers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('returns paginated products on successful 200 response', async () => {
      const mockData = createMockPaginatedProducts();
      mocks.get.mockResolvedValueOnce(createSuccessApiResponse(mockData));

      const result = await getProducts({ page: 1, limit: 12 });
      expect(result).toEqual(mockData);
    });

    it('preserves HTTP status code on error and does not convert to 503', async () => {
      mocks.get.mockResolvedValueOnce(
        createErrorApiResponse({ statusCode: 429, message: 'Too many requests' }, 429),
      );

      await expect(getProducts({ page: 1, limit: 12 })).rejects.toMatchObject({
        statusCode: 429,
        name: 'ApiRequestError',
      });
    });

    it('throws 500 on malformed 200 response (data is null or undefined)', async () => {
      mocks.get.mockResolvedValueOnce({
        data: null,
        error: undefined,
        response: new Response('null', { status: 200 }),
      });

      await expect(getProducts({ page: 1, limit: 12 })).rejects.toMatchObject({
        statusCode: 500,
        message: 'Malformed product list response',
      });
    });

    it('wraps raw network failure in 503 ApiRequestError', async () => {
      mocks.get.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(getProducts({ page: 1, limit: 12 })).rejects.toMatchObject({
        statusCode: 503,
        message: 'API unavailable',
      });
    });

    it('forwards normalized primitive filter parameters to the API client', async () => {
      const mockData = createMockPaginatedProducts();
      mocks.get.mockResolvedValueOnce(createSuccessApiResponse(mockData));

      const result = await getProducts({
        page: 2,
        limit: 24,
        categoryId: 3,
        search: 'laptop',
        minPrice: 100,
        maxPrice: 1000,
        sortBy: 'price',
        sortOrder: 'desc',
      });

      expect(result).toEqual(mockData);
      expect(mocks.get).toHaveBeenCalledWith('/v1/products', {
        params: {
          query: {
            page: 2,
            limit: 24,
            categoryId: 3,
            search: 'laptop',
            minPrice: 100,
            maxPrice: 1000,
            sortBy: 'price',
            sortOrder: 'desc',
          },
        },
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('getProduct', () => {
    it('returns product detail on 200 active product', async () => {
      const mockProduct = createMockProductDetail({
        name: 'Laptop',
        slug: 'laptop',
        price: 1200,
      });

      mocks.get.mockResolvedValueOnce(createSuccessApiResponse(mockProduct));

      const result = await getProduct(1);
      expect(result).toEqual(mockProduct);
    });

    it('returns null on 404 response', async () => {
      mocks.get.mockResolvedValueOnce(
        createErrorApiResponse({ statusCode: 404, message: 'Product not found' }, 404),
      );

      const result = await getProduct(999);
      expect(result).toBeNull();
    });

    it('returns null if product is returned with isActive = false', async () => {
      const mockProduct = createMockProductDetail({
        id: 2,
        name: 'Inactive Laptop',
        isActive: false,
      });

      mocks.get.mockResolvedValueOnce(createSuccessApiResponse(mockProduct));

      const result = await getProduct(2);
      expect(result).toBeNull();
    });

    it('throws ApiRequestError on upstream 500 error', async () => {
      mocks.get.mockResolvedValueOnce(
        createErrorApiResponse({ statusCode: 500, message: 'Database failure' }, 500),
      );

      await expect(getProduct(1)).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });

  describe('getCategories', () => {
    it('returns category array on 200', async () => {
      const mockCategories = [createMockCategory()];

      mocks.get.mockResolvedValueOnce(createSuccessApiResponse(mockCategories));

      const result = await getCategories();
      expect(result).toEqual(mockCategories);
    });

    it('throws 500 on malformed category response (not an array)', async () => {
      mocks.get.mockResolvedValueOnce(
        createSuccessApiResponse({ message: 'not an array' }),
      );

      await expect(getCategories()).rejects.toMatchObject({
        statusCode: 500,
        message: 'Malformed category response',
      });
    });
  });

  describe('getProductInventory', () => {
    it('returns null on 200 when data is null (no inventory row)', async () => {
      mocks.get.mockResolvedValueOnce({
        data: null,
        error: undefined,
        response: new Response('null', { status: 200 }),
      });

      const result = await getProductInventory(1);
      expect(result).toBeNull();
    });

    it('returns inventory data on 200 with inventory item', async () => {
      const mockInventory = createMockInventory();

      mocks.get.mockResolvedValueOnce(createSuccessApiResponse(mockInventory));

      const result = await getProductInventory(1);
      expect(result).toEqual(mockInventory);
    });

    it('throws 500 on 200 when data is undefined (malformed response)', async () => {
      mocks.get.mockResolvedValueOnce({
        data: undefined,
        error: undefined,
        response: new Response(null, { status: 200 }),
      });

      await expect(getProductInventory(1)).rejects.toMatchObject({
        statusCode: 500,
        message: 'Malformed inventory response',
      });
    });

    it('throws ApiRequestError on upstream error', async () => {
      mocks.get.mockResolvedValueOnce(
        createErrorApiResponse({ statusCode: 500, message: 'Inventory service down' }, 500),
      );

      await expect(getProductInventory(1)).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });
});
