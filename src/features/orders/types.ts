// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { components, operations } from '@/lib/api/generated/schema';

export type OrderListItemResponseDto =
  components['schemas']['OrderListItemResponseDto'];
export type PaginatedOrdersResponseDto =
  components['schemas']['PaginatedOrdersResponseDto'];
export type OrderDetailResponseDto =
  components['schemas']['OrderDetailResponseDto'];
export type OrderItemDetailResponseDto =
  components['schemas']['OrderItemDetailResponseDto'];
export type PaymentDetailResponseDto =
  components['schemas']['PaymentDetailResponseDto'];

export type OrderStatus = OrderDetailResponseDto['status'];

export type OrderListQuery = NonNullable<
  operations['OrdersController_findAll_v1']['parameters']['query']
>;

export type ShopperOrderListQuery = Pick<
  OrderListQuery,
  | 'page'
  | 'limit'
  | 'status'
  | 'sortBy'
  | 'sortOrder'
  | 'createdAfter'
  | 'createdBefore'
  | 'minAmount'
  | 'maxAmount'
>;
