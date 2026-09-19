import { http, HttpResponse } from 'msw';
import {
  DEMO_CUSTOMER_EMAIL,
  DEMO_CUSTOMER_USER_ID,
} from '@/lib/mock/constants';
import {
  cartTotals,
  ensureMockCart,
  getMockStore,
  isMockSessionActive,
  setMockSessionActive,
} from '@/lib/mock/data/store';
import {
  categoriesWithProductCounts,
  toProductDetail,
  toProductListItem,
} from '@/lib/mock/lib/catalog';
import { createMockJwt } from '@/lib/mock/lib/jwt';

function customerSessionBody() {
  return {
    accessToken: createMockJwt({
      sub: String(DEMO_CUSTOMER_USER_ID),
      email: DEMO_CUSTOMER_EMAIL,
      role: 'customer',
    }),
    mustChangePassword: false,
    permissions: ['manage_own_cart', 'view_own_orders'],
  };
}

function cartResponse() {
  const store = getMockStore();
  if (!store.cart) {
    return null;
  }
  const totals = cartTotals(store.cart);
  return {
    id: store.cart.id,
    userId: store.cart.userId,
    items: store.cart.items,
    itemCount: totals.itemCount,
    subtotal: totals.subtotal,
    shippingCost: totals.shippingCost,
    totalAmount: totals.totalAmount,
    currency: totals.currency,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function inventoryForProduct(productId: number) {
  return getMockStore().inventory.find((row) => row.productId === productId);
}

export const handlers = [
  http.post('*/v1/authentication/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email !== DEMO_CUSTOMER_EMAIL || !body.password) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    setMockSessionActive(true);
    return HttpResponse.json(customerSessionBody());
  }),

  http.post('*/v1/authentication/refresh', () => {
    if (!isMockSessionActive()) {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json(customerSessionBody());
  }),

  http.post('*/v1/authentication/logout', () => {
    setMockSessionActive(false);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/v1/users/me', () => {
    if (!isMockSessionActive()) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({
      id: DEMO_CUSTOMER_USER_ID,
      email: DEMO_CUSTOMER_EMAIL,
      firstName: 'Demo',
      lastName: 'Customer',
      addresses: [],
    });
  }),

  http.get('*/v1/products', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 12);
    const store = getMockStore();
    const products = store.products.filter((product) => product.isActive);
    const start = (page - 1) * limit;
    const items = products.slice(start, start + limit).map(toProductListItem);
    const total = products.length;
    return HttpResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }),

  http.get('*/v1/products/:id', ({ params }) => {
    const product = getMockStore().products.find(
      (item) => item.id === Number(params.id),
    );
    if (!product) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(toProductDetail(product));
  }),

  http.get('*/v1/categories', () => {
    const store = getMockStore();
    return HttpResponse.json(
      categoriesWithProductCounts(store.categories, store.products),
    );
  }),

  http.get('*/v1/inventory/check/:productId', ({ params }) => {
    const productId = Number(params.productId);
    const stock = inventoryForProduct(productId);
    const availableQuantity = stock?.availableQuantity ?? 0;
    return HttpResponse.json({
      productId,
      availableQuantity,
      isAvailable: availableQuantity > 0,
    });
  }),

  http.get('*/v1/carts/current', () => {
    if (!isMockSessionActive()) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (!getMockStore().cart) {
      return HttpResponse.json({ message: 'No cart' }, { status: 404 });
    }
    return HttpResponse.json(cartResponse());
  }),

  http.post('*/v1/carts', () => {
    if (!isMockSessionActive()) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    ensureMockCart(DEMO_CUSTOMER_USER_ID);
    return HttpResponse.json(cartResponse(), { status: 201 });
  }),

  http.post('*/v1/carts/:id/items', async ({ request }) => {
    if (!isMockSessionActive()) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = (await request.json()) as { productId?: number; quantity?: number };
    const store = getMockStore();
    const cart = ensureMockCart(DEMO_CUSTOMER_USER_ID)!;
    const product = store.products.find((item) => item.id === body.productId);
    if (!product) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const quantity = body.quantity ?? 1;
    const subtotal = Number((product.price * quantity).toFixed(2));
    cart.items.push({
      id: store.nextCartItemId++,
      productId: product.id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
      quantity,
      subtotal,
      imageUrl: product.imageUrl ?? null,
    });
    return HttpResponse.json(cartResponse());
  }),

  http.post('*/v1/orders/checkout', () => {
    if (!isMockSessionActive()) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const store = getMockStore();
    const cart = store.cart;
    if (!cart || cart.items.length === 0) {
      return HttpResponse.json({ message: 'Cart is empty' }, { status: 400 });
    }
    const totals = cartTotals(cart);
    const orderId = store.nextOrderId++;
    const now = new Date().toISOString();
    const order = {
      id: orderId,
      orderNumber: `ORD-${orderId}`,
      userId: DEMO_CUSTOMER_USER_ID,
      userName: 'Demo Customer',
      userEmail: DEMO_CUSTOMER_EMAIL,
      status: 'confirmed',
      shippingAddress: '123 Demo Street, Austin, TX 78701, US',
      items: cart.items.map((item) => {
        const product = store.products.find(
          (candidate) => candidate.id === item.productId,
        );
        return {
          productId: item.productId,
          sku: product?.sku ?? `SKU-${item.productId}`,
          title: item.productName,
          unitPrice: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        };
      }),
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      totalAmount: totals.totalAmount,
      totalPrice: totals.totalAmount,
      currency: totals.currency,
      createdAt: now,
      updatedAt: now,
    };
    store.orders.unshift(order);
    store.cart = { id: cart.id, userId: cart.userId, items: [] };
    return HttpResponse.json({ orderId, jobId: `mock-job-${orderId}` }, { status: 201 });
  }),

  http.get('*/v1/orders/:id', ({ params }) => {
    if (!isMockSessionActive()) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const order = getMockStore().orders.find(
      (item) => item.id === Number(params.id),
    );
    if (!order) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(order);
  }),

  http.get('*/v1/orders', () => {
    if (!isMockSessionActive()) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const orders = getMockStore().orders;
    return HttpResponse.json({
      data: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
      })),
      meta: { total: orders.length, page: 1, limit: 20, totalPages: 1 },
    });
  }),
];
