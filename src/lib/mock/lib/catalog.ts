// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  CategoryResponseDto,
  ProductDetailResponseDto,
  ProductListItemResponseDto,
} from '@/lib/mock/data/types';
import { slugify } from '@/lib/mock/lib/slugify';

export function categoryNameForId(
  categories: CategoryResponseDto[],
  categoryId?: number | null,
): string | null {
  if (categoryId == null) {
    return null;
  }
  return categories.find((category) => category.id === categoryId)?.name ?? null;
}

export function categoriesWithProductCounts(
  categories: CategoryResponseDto[],
  products: ProductDetailResponseDto[],
): CategoryResponseDto[] {
  return categories.map((category) => ({
    ...category,
    productCount: products.filter(
      (product) => product.categoryId === category.id && product.isActive,
    ).length,
  }));
}

export function toProductListItem(
  product: ProductDetailResponseDto,
): ProductListItemResponseDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    currency: product.currency,
    imageUrl: product.imageUrl,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function toProductDetail(
  product: ProductDetailResponseDto,
): ProductDetailResponseDto {
  return {
    ...product,
    slug: product.slug || slugify(product.name),
    description: product.description ?? null,
  };
}
