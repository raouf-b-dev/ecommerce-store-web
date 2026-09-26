// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  Category,
  PaginatedProducts,
  ProductDetail,
  ProductInventory,
  ProductListItem,
} from '@/features/catalog/types';

export function createMockProductListItem(
  overrides?: Partial<ProductListItem>,
): ProductListItem {
  return {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    price: 100,
    currency: 'USD',
    sku: 'TEST-001',
    isActive: true,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
    ...overrides,
  };
}

export function createMockPaginatedProducts(
  overrides?: Partial<PaginatedProducts>,
): PaginatedProducts {
  const items = overrides?.items ?? [createMockProductListItem()];
  return {
    items,
    total: overrides?.total ?? items.length,
    page: overrides?.page ?? 1,
    limit: overrides?.limit ?? 12,
    totalPages: overrides?.totalPages ?? 1,
    ...overrides,
  };
}

export function createMockProductDetail(
  overrides?: Partial<ProductDetail>,
): ProductDetail {
  return {
    id: 1,
    name: 'Test Product Detail',
    slug: 'test-product-detail',
    description: 'A detailed description for testing',
    price: 100,
    currency: 'USD',
    sku: 'TEST-001',
    isActive: true,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
    ...overrides,
  };
}

export function createMockCategory(
  overrides?: Partial<Category>,
): Category {
  return {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    isActive: true,
    productCount: 1,
    ...overrides,
  };
}

export function createMockInventory(
  overrides?: Partial<ProductInventory>,
): ProductInventory {
  return {
    isAvailable: true,
    availableQuantity: 10,
    requestedQuantity: 1,
    ...overrides,
  };
}
