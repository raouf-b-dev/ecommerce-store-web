const MOCK_SESSION_KEY = 'store-web-mock-session';

export type MockProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  isActive: boolean;
  categoryId: number;
  imageUrl: string | null;
};

export type MockCartItem = {
  id: number;
  productId: number;
  productName: string;
  price: number;
  currency: string;
  quantity: number;
  subtotal: number;
  imageUrl: string | null;
};

export type MockOrder = {
  id: number;
  orderNumber: string;
  userId: number;
  status: string;
  shippingAddress: string;
  items: Array<{
    productId: number;
    sku: string;
    title: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  totalPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

type MockStore = {
  products: MockProduct[];
  cart: {
    id: number;
    userId: number;
    items: MockCartItem[];
  } | null;
  orders: MockOrder[];
  nextOrderId: number;
  nextCartItemId: number;
};

const seedProducts: MockProduct[] = [
  {
    id: 1,
    title: 'Wireless Headphones',
    description: 'Noise-canceling over-ear headphones.',
    price: 199.99,
    currency: 'USD',
    sku: 'ELEC-ANC-001',
    isActive: true,
    categoryId: 1,
    imageUrl: null,
  },
  {
    id: 2,
    title: 'Mechanical Keyboard',
    description: 'Hot-swappable switches, RGB backlight.',
    price: 129.99,
    currency: 'USD',
    sku: 'ELEC-KBD-002',
    isActive: true,
    categoryId: 1,
    imageUrl: null,
  },
];

let store: MockStore = {
  products: seedProducts,
  cart: null,
  orders: [],
  nextOrderId: 1001,
  nextCartItemId: 1,
};

export function getMockStore(): MockStore {
  return store;
}

export function resetMockStore(): void {
  store = {
    products: [...seedProducts],
    cart: null,
    orders: [],
    nextOrderId: 1001,
    nextCartItemId: 1,
  };
}

export function isMockSessionActive(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.sessionStorage.getItem(MOCK_SESSION_KEY) === '1';
}

export function setMockSessionActive(active: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (active) {
    window.sessionStorage.setItem(MOCK_SESSION_KEY, '1');
  } else {
    window.sessionStorage.removeItem(MOCK_SESSION_KEY);
  }
}

export function ensureMockCart(userId: number): MockStore['cart'] {
  if (!store.cart) {
    store.cart = { id: 42, userId, items: [] };
  }
  return store.cart;
}

export function cartTotals(cart: NonNullable<MockStore['cart']>) {
  const subtotal = Number(
    cart.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
  );
  const shippingCost = 0;
  const totalAmount = Number((subtotal + shippingCost).toFixed(2));
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const currency = cart.items[0]?.currency ?? 'USD';
  return { subtotal, shippingCost, totalAmount, itemCount, currency };
}
