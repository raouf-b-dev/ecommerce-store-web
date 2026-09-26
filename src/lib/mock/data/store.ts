// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import {
  createSeedCategories,
  createSeedInventory,
  createSeedProducts,
} from '@/lib/mock/data/seed';
import type {
  CategoryResponseDto,
  MockCartItem,
  ProductDetailResponseDto,
  SeedInventoryRow,
} from '@/lib/mock/data/types';
import {
  DEMO_CUSTOMER_EMAIL,
  DEMO_CUSTOMER_USER_ID,
} from '@/lib/mock/constants';

const MOCK_SESSION_KEY = 'store-web-mock-session';

export type MockAddress = {
  id: number;
  street: string;
  street2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: string;
  isDefault: boolean;
  deliveryInstructions: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MockUserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  roleCode: string;
  addressCount: number;
  addresses: MockAddress[];
  createdAt: string;
  updatedAt: string;
  nextAddressId: number;
};

export type MockOrder = {
  id: number;
  orderNumber: string;
  userId: number;
  userName: string;
  userEmail: string;
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
  userProfile: MockUserProfile;
  nextOrderId: number;
  nextCartItemId: number;
};

function createInitialUserProfile(): MockUserProfile {
  const now = new Date().toISOString();
  const addresses: MockAddress[] = [
    {
      id: 1,
      street: '100 Main Street',
      street2: 'Apartment 2B',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      country: 'US',
      type: 'HOME',
      isDefault: true,
      deliveryInstructions: 'Leave packages at front door.',
      createdAt: now,
      updatedAt: now,
    },
  ];
  return {
    id: DEMO_CUSTOMER_USER_ID,
    firstName: 'Demo',
    lastName: 'Customer',
    email: DEMO_CUSTOMER_EMAIL,
    phone: null,
    isActive: true,
    roleCode: 'CUSTOMER',
    addressCount: addresses.length,
    addresses,
    createdAt: now,
    updatedAt: now,
    nextAddressId: 2,
  };
}

function cloneSeed(): MockStore {
  return {
    products: structuredClone(createSeedProducts()),
    categories: structuredClone(createSeedCategories()),
    inventory: structuredClone(createSeedInventory()),
    cart: null,
    orders: [],
    userProfile: createInitialUserProfile(),
    nextOrderId: 1001,
    nextCartItemId: 1,
  };
}

const store: MockStore = cloneSeed();

export function getMockStore(): MockStore {
  return store;
}

let mockSessionActive =
  typeof window !== 'undefined' &&
  window.sessionStorage.getItem(MOCK_SESSION_KEY) === '1';

export function isMockSessionActive(): boolean {
  return mockSessionActive;
}

export function getMockUserProfile(): MockUserProfile {
  const profile = store.userProfile;
  return {
    ...profile,
    addressCount: profile.addresses.length,
    addresses: structuredClone(profile.addresses),
  };
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
  // Matches API CartResponseDto: sum of line quantities, not unique SKUs.
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  // Null when the cart has no items (OpenAPI CartResponseDto.currency).
  const currency = cart.items[0]?.currency ?? null;
  return { subtotal, shippingCost, totalAmount, itemCount, currency };
}
