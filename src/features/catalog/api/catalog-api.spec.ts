import { beforeEach, describe, expect, it, vi } from 'vitest';
import { serverClient } from '@/lib/api/server-client';
import { getProducts } from '@/features/catalog/api/get-products';
import { getProduct } from '@/features/catalog/api/get-product';
import { getCategories } from '@/features/catalog/api/get-categories';
import { getProductInventory } from '@/features/catalog/api/get-product-inventory';

vi.mock('@/lib/api/server-client', () => ({
  serverClient: {
    GET: vi.fn(),
  },
}));

describe('catalog-api fetchers', () => {
  const mockGet = vi.mocked(serverClient.GET);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('returns paginated products on successful 200 response', async () => {
      const mockData = {
        items: [{ id: 1, name: 'Phone', price: 500, currency: 'USD', isActive: true, createdAt: '', sku: 'SKU1' }],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      };

      mockGet.mockResolvedValueOnce({
        data: mockData,
        error: undefined,
        response: new Response(JSON.stringify(mockData), { status: 200 }),
      } as never);

      const result = await getProducts({ page: 1, limit: 12 });
      expect(result).toEqual(mockData);
    });

    it('preserves HTTP status code on error and does not convert to 503', async () => {
      mockGet.mockResolvedValueOnce({
        data: undefined,
        error: { statusCode: 429, message: 'Too many requests' },
        response: new Response(JSON.stringify({ statusCode: 429, message: 'Too many requests' }), {
          status: 429,
        }),
      } as never);

      await expect(getProducts({ page: 1, limit: 12 })).rejects.toMatchObject({
        statusCode: 429,
        name: 'ApiRequestError',
      });
    });

    it('throws 500 on malformed 200 response (data is null or undefined)', async () => {
      mockGet.mockResolvedValueOnce({
        data: null,
        error: undefined,
        response: new Response('null', { status: 200 }),
      } as never);

      await expect(getProducts({ page: 1, limit: 12 })).rejects.toMatchObject({
        statusCode: 500,
        message: 'Malformed product list response',
      });
    });

    it('wraps raw network failure in 503 ApiRequestError', async () => {
      mockGet.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(getProducts({ page: 1, limit: 12 })).rejects.toMatchObject({
        statusCode: 503,
        message: 'API unavailable',
      });
    });
  });

  describe('getProduct', () => {
    it('returns product detail on 200 active product', async () => {
      const mockProduct = {
        id: 1,
        name: 'Laptop',
        price: 1200,
        currency: 'USD',
        isActive: true,
        createdAt: '',
        sku: 'SKU2',
        slug: 'laptop',
      };

      mockGet.mockResolvedValueOnce({
        data: mockProduct,
        error: undefined,
        response: new Response(JSON.stringify(mockProduct), { status: 200 }),
      } as never);

      const result = await getProduct(1);
      expect(result).toEqual(mockProduct);
    });

    it('returns null on 404 response', async () => {
      mockGet.mockResolvedValueOnce({
        data: undefined,
        error: { statusCode: 404, message: 'Product not found' },
        response: new Response(null, { status: 404 }),
      } as never);

      const result = await getProduct(999);
      expect(result).toBeNull();
    });

    it('returns null if product is returned with isActive = false', async () => {
      const mockProduct = {
        id: 2,
        name: 'Inactive Laptop',
        price: 1200,
        currency: 'USD',
        isActive: false,
        createdAt: '',
        sku: 'SKU3',
        slug: 'inactive-laptop',
      };

      mockGet.mockResolvedValueOnce({
        data: mockProduct,
        error: undefined,
        response: new Response(JSON.stringify(mockProduct), { status: 200 }),
      } as never);

      const result = await getProduct(2);
      expect(result).toBeNull();
    });

    it('throws ApiRequestError on upstream 500 error', async () => {
      mockGet.mockResolvedValueOnce({
        data: undefined,
        error: { statusCode: 500, message: 'Database failure' },
        response: new Response(null, { status: 500 }),
      } as never);

      await expect(getProduct(1)).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });

  describe('getCategories', () => {
    it('returns category array on 200', async () => {
      const mockCategories = [{ id: 1, name: 'Electronics', slug: 'electronics', isActive: true }];

      mockGet.mockResolvedValueOnce({
        data: mockCategories,
        error: undefined,
        response: new Response(JSON.stringify(mockCategories), { status: 200 }),
      } as never);

      const result = await getCategories();
      expect(result).toEqual(mockCategories);
    });

    it('throws 500 on malformed category response (not an array)', async () => {
      mockGet.mockResolvedValueOnce({
        data: { message: 'not an array' },
        error: undefined,
        response: new Response('{}', { status: 200 }),
      } as never);

      await expect(getCategories()).rejects.toMatchObject({
        statusCode: 500,
        message: 'Malformed category response',
      });
    });
  });

  describe('getProductInventory', () => {
    it('returns null on 200 when data is null (no inventory row)', async () => {
      mockGet.mockResolvedValueOnce({
        data: null,
        error: undefined,
        response: new Response('null', { status: 200 }),
      } as never);

      const result = await getProductInventory(1);
      expect(result).toBeNull();
    });

    it('returns inventory data on 200 with inventory item', async () => {
      const mockInventory = {
        id: 1,
        productId: 1,
        sku: 'SKU1',
        productTitle: 'Phone',
        availableQuantity: 10,
        reservedQuantity: 0,
        totalQuantity: 10,
      };

      mockGet.mockResolvedValueOnce({
        data: mockInventory,
        error: undefined,
        response: new Response(JSON.stringify(mockInventory), { status: 200 }),
      } as never);

      const result = await getProductInventory(1);
      expect(result).toEqual(mockInventory);
    });

    it('throws 500 on 200 when data is undefined (malformed response)', async () => {
      mockGet.mockResolvedValueOnce({
        data: undefined,
        error: undefined,
        response: new Response(null, { status: 200 }),
      } as never);

      await expect(getProductInventory(1)).rejects.toMatchObject({
        statusCode: 500,
        message: 'Malformed inventory response',
      });
    });

    it('throws ApiRequestError on upstream error', async () => {
      mockGet.mockResolvedValueOnce({
        data: undefined,
        error: { statusCode: 500, message: 'Inventory service down' },
        response: new Response(null, { status: 500 }),
      } as never);

      await expect(getProductInventory(1)).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });
});
