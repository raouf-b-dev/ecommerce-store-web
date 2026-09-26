// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { components, operations } from '@/lib/api/generated/schema';

export type ProductsQueryParams = NonNullable<
  operations['ProductsController_findAll_v1']['parameters']['query']
>;
export type ProductSortBy = NonNullable<ProductsQueryParams['sortBy']>;
export type SortOrder = NonNullable<ProductsQueryParams['sortOrder']>;

export type ProductListItem =
  components['schemas']['ProductListItemResponseDto'];
export type PaginatedProducts =
  components['schemas']['PaginatedProductsResponseDto'];
export type ProductDetail = components['schemas']['ProductDetailResponseDto'];
export type Category = components['schemas']['CategoryResponseDto'];
export type ProductInventory = components['schemas']['CheckStockResponseDto'];

export type CatalogFilterParams = Pick<
  ProductsQueryParams,
  'search' | 'categoryId' | 'minPrice' | 'maxPrice' | 'sortBy' | 'sortOrder'
> & {
  page: number;
  limit: number;
};
