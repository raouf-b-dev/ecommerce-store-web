// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import {
  DEMO_CUSTOMER_EMAIL,
  DEMO_CUSTOMER_PASSWORD,
} from '@/lib/mock/constants';
import { handlers } from '@/lib/mock/handlers';

const API = 'http://localhost:3000';
const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers(...handlers);
});

afterAll(() => {
  server.close();
});

type ProductListBody = {
  items: Array<{ id: number; name: string; categoryId: number | null; price: number }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function listProducts(query = ''): Promise<ProductListBody> {
  const response = await fetch(`${API}/v1/products${query}`);
  expect(response.ok).toBe(true);
  return response.json() as Promise<ProductListBody>;
}

describe('storefront mock handlers', () => {
  describe('GET /v1/products', () => {
    it('returns only products for the requested categoryId', async () => {
      const body = await listProducts('?categoryId=2');

      expect(body.total).toBeGreaterThan(0);
      expect(body.items.length).toBe(body.total);
      expect(body.items.every((item) => item.categoryId === 2)).toBe(true);
    });

    it('returns different product sets for different categories', async () => {
      const electronics = await listProducts('?categoryId=1');
      const clothing = await listProducts('?categoryId=2');

      const electronicsIds = new Set(electronics.items.map((item) => item.id));
      const clothingIds = clothing.items.map((item) => item.id);

      expect(electronics.total).not.toBe(clothing.total);
      expect(clothingIds.some((id) => electronicsIds.has(id))).toBe(false);
    });

    it('filters by search text', async () => {
      const body = await listProducts('?search=hoodie');

      expect(body.total).toBeGreaterThan(0);
      expect(
        body.items.every((item) => item.name.toLowerCase().includes('hoodie')),
      ).toBe(true);
    });

    it('filters by minPrice and maxPrice', async () => {
      const body = await listProducts('?minPrice=50&maxPrice=100');

      expect(body.total).toBeGreaterThan(0);
      expect(
        body.items.every((item) => item.price >= 50 && item.price <= 100),
      ).toBe(true);
    });

    it('sorts by price ascending', async () => {
      const body = await listProducts('?sortBy=price&sortOrder=asc&limit=100');
      const prices = body.items.map((item) => item.price);

      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('paginates results', async () => {
      const page1 = await listProducts('?limit=5&page=1');
      const page2 = await listProducts('?limit=5&page=2');

      expect(page1.items).toHaveLength(5);
      expect(page2.items.length).toBeGreaterThan(0);
      expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
      expect(page1.total).toBe(page2.total);
    });
  });

  describe('POST /v1/authentication/login', () => {
    it('accepts the demo customer credentials', async () => {
      const response = await fetch(`${API}/v1/authentication/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: DEMO_CUSTOMER_EMAIL,
          password: DEMO_CUSTOMER_PASSWORD,
        }),
      });

      expect(response.status).toBe(200);
      const body = (await response.json()) as { accessToken?: string };
      expect(body.accessToken).toBeTruthy();
    });

    it('rejects the wrong password', async () => {
      const response = await fetch(`${API}/v1/authentication/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: DEMO_CUSTOMER_EMAIL,
          password: 'wrong-password',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('authenticated shopper flows', () => {
    beforeAll(async () => {
      await fetch(`${API}/v1/authentication/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: DEMO_CUSTOMER_EMAIL,
          password: DEMO_CUSTOMER_PASSWORD,
        }),
      });
    });

    it('lists orders in the OpenAPI paginated shape', async () => {
      await fetch(`${API}/v1/carts`, { method: 'POST' });
      const products = await listProducts('?limit=1');
      const productId = products.items[0]?.id;
      expect(productId).toBeDefined();

      await fetch(`${API}/v1/carts/42/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const checkout = await fetch(`${API}/v1/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: 42, paymentMethod: 'STRIPE' }),
      });
      expect(checkout.status).toBe(201);

      const response = await fetch(`${API}/v1/orders`);
      expect(response.ok).toBe(true);
      const body = (await response.json()) as {
        items: Array<{ id: number; itemCount: number; userEmail: string }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        data?: unknown;
        meta?: unknown;
      };

      expect(body.data).toBeUndefined();
      expect(body.meta).toBeUndefined();
      expect(body.items.length).toBeGreaterThan(0);
      expect(body.total).toBe(body.items.length);
      expect(body.items[0]?.itemCount).toBeGreaterThan(0);
      expect(body.items[0]?.userEmail).toBe(DEMO_CUSTOMER_EMAIL);
    });

    it('returns a payment stub for an order', async () => {
      const orders = (await (
        await fetch(`${API}/v1/orders`)
      ).json()) as { items: Array<{ id: number }> };
      const orderId = orders.items[0]?.id;
      expect(orderId).toBeDefined();

      const response = await fetch(`${API}/v1/payments/orders/${orderId}`);
      expect(response.ok).toBe(true);
      const body = (await response.json()) as { orderId: number; status: string };
      expect(body.orderId).toBe(orderId);
      expect(body.status).toBe('completed');
    });

    it('rejects cart quantity updates above available stock with Nest-shaped 422', async () => {
      await fetch(`${API}/v1/carts`, { method: 'POST' });
      const products = await listProducts('?limit=1');
      const productId = products.items[0]?.id;
      expect(productId).toBeDefined();

      const inventory = (await (
        await fetch(`${API}/v1/inventory/check/${productId}`)
      ).json()) as { availableQuantity: number };
      const available = inventory.availableQuantity;
      expect(available).toBeGreaterThan(0);

      const add = await fetch(`${API}/v1/carts/42/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      expect(add.ok).toBe(true);
      const cart = (await add.json()) as {
        items: Array<{ id: number; quantity: number }>;
        itemCount: number;
      };
      const itemId = cart.items[0]?.id;
      expect(itemId).toBeDefined();
      expect(cart.itemCount).toBe(1);

      const patch = await fetch(`${API}/v1/carts/42/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: available + 1 }),
      });
      expect(patch.status).toBe(422);
      const error = (await patch.json()) as {
        success: boolean;
        statusCode: number;
        message: string;
      };
      expect(error.success).toBe(false);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe(
        `Insufficient stock for product. Available: ${available}`,
      );
    });

    it('rejects add-to-cart above available stock', async () => {
      await fetch(`${API}/v1/carts`, { method: 'POST' });
      const products = await listProducts('?limit=1');
      const productId = products.items[0]?.id;
      expect(productId).toBeDefined();

      const inventory = (await (
        await fetch(`${API}/v1/inventory/check/${productId}`)
      ).json()) as { availableQuantity: number };
      const productName = products.items[0]?.name;

      const add = await fetch(`${API}/v1/carts/42/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: inventory.availableQuantity + 1,
        }),
      });
      expect(add.status).toBe(422);
      const error = (await add.json()) as {
        statusCode: number;
        message: string;
      };
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe(
        `Insufficient stock for product ${productName}`,
      );
    });

    it('sets the default address via PATCH', async () => {
      const me = (await (await fetch(`${API}/v1/users/me`)).json()) as {
        id: number;
        addresses: Array<{ id: number; isDefault: boolean }>;
      };
      const create = await fetch(`${API}/v1/users/${me.id}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: '9 Mock Lane',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
          type: 'HOME',
          isDefault: false,
        }),
      });
      expect(create.status).toBe(201);
      const address = (await create.json()) as { id: number };

      const response = await fetch(
        `${API}/v1/users/${me.id}/addresses/${address.id}/set-default`,
        { method: 'PATCH' },
      );
      expect(response.ok).toBe(true);
      const body = (await response.json()) as { id: number; isDefault: boolean };
      expect(body.id).toBe(address.id);
      expect(body.isDefault).toBe(true);
    });
  });

  describe('health probes', () => {
    it('serves aggregate health and readiness for /status', async () => {
      const health = await fetch(`${API}/health`);
      const readiness = await fetch(`${API}/health/readiness`);

      expect(health.ok).toBe(true);
      expect(readiness.ok).toBe(true);
      expect(((await health.json()) as { status: string }).status).toBe('ok');
      expect(((await readiness.json()) as { status: string }).status).toBe('ok');
    });
  });

  describe('unimplemented mutating routes', () => {
    it('returns 501 instead of falling through', async () => {
      const response = await fetch(`${API}/v1/does-not-exist-yet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(response.status).toBe(501);
    });
  });
});
