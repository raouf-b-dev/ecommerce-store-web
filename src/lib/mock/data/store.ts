import {
  createSeedCategories,
  createSeedInventory,
  createSeedProducts,
} from '@/lib/mock/data/seed';
import type {
  CategoryResponseDto,
  ProductDetailResponseDto,
  SeedInventoryRow,
} from '@/lib/mock/data/types';

const MOCK_SESSION_KEY = 'store-web-mock-session';

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

export type MockStore = {
  products: ProductDetailResponseDto[];
  categories: CategoryResponseDto[];
  inventory: SeedInventoryRow[];
  cart: {
    id: number;
    userId: number;
    items: MockCartItem[];
  } | null;
  orders: MockOrder[];
  nextOrderId: number;
  nextCartItemId: number;
};

function cloneSeed(): MockStore {
  return {
    products: structuredClone(createSeedProducts()),
    categories: structuredClone(createSeedCategories()),
    inventory: structuredClone(createSeedInventory()),
    cart: null,
    orders: [],
    nextOrderId: 1001,
    nextCartItemId: 1,
  };
}

let store: MockStore = cloneSeed();

export function getMockStore(): MockStore {
  return store;
}

export function resetMockStore(): void {
  store = cloneSeed();
  mockSessionActive = false;
}

let mockSessionActive = false;

export function isMockSessionActive(): boolean {
  return mockSessionActive;
}

export function setMockSessionActive(active: boolean): void {
  mockSessionActive = active;
  if (typeof window !== 'undefined') {
    if (active) {
      window.sessionStorage.setItem(MOCK_SESSION_KEY, '1');
    } else {
      window.sessionStorage.removeItem(MOCK_SESSION_KEY);
    }
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
