// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { Route } from 'next';
import {
  parseNonNegativeNumber,
  parsePositiveInt,
} from '@/lib/list-filters';
import { formatStatusLabel } from '@/lib/format';
import type {
  OrderListQuery,
  OrderStatus,
  ShopperOrderListQuery,
} from '@/features/orders/types';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export const ORDER_STATUS_VALUES = [
  'pending_payment',
  'payment_failed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_OPTIONS = ORDER_STATUS_VALUES.map((value) => ({
  value,
  label: formatStatusLabel(value),
}));

export const SORT_BY_VALUES = [
  'createdAt',
  'updatedAt',
  'totalPrice',
] as const satisfies readonly NonNullable<OrderListQuery['sortBy']>[];

export const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'totalPrice', label: 'Total' },
] as const satisfies readonly {
  value: NonNullable<OrderListQuery['sortBy']>;
  label: string;
}[];

export const SORT_ORDER_VALUES = [
  'asc',
  'desc',
] as const satisfies readonly NonNullable<OrderListQuery['sortOrder']>[];

export const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
] as const satisfies readonly {
  value: NonNullable<OrderListQuery['sortOrder']>;
  label: string;
}[];

function getSingleParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function isOrderStatus(value: string | undefined): value is OrderStatus {
  return (
    value !== undefined &&
    (ORDER_STATUS_VALUES as readonly string[]).includes(value)
  );
}

function isSortBy(
  value: string | undefined,
): value is NonNullable<OrderListQuery['sortBy']> {
  return (
    value !== undefined &&
    (SORT_BY_VALUES as readonly string[]).includes(value)
  );
}

function isSortOrder(
  value: string | undefined,
): value is NonNullable<OrderListQuery['sortOrder']> {
  return (
    value !== undefined &&
    (SORT_ORDER_VALUES as readonly string[]).includes(value)
  );
}

function parseOptionalIsoDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return trimmed;
}

/**
 * Parses shopper-safe order list filters from URL searchParams.
 * Admin identity filters (userId, userEmail, firstName, lastName, userName) are ignored.
 */
export function hasActiveOrderListFilters(
  filters: ShopperOrderListQuery,
): boolean {
  return Boolean(
    filters.status !== undefined ||
      filters.sortBy !== undefined ||
      filters.sortOrder !== undefined ||
      filters.createdAfter !== undefined ||
      filters.createdBefore !== undefined ||
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined,
  );
}

export function parseOrderListFilters(
  raw: Record<string, string | string[] | undefined>,
): ShopperOrderListQuery {
  const rawPage = parsePositiveInt(getSingleParam(raw.page));
  const page = rawPage && rawPage >= 1 ? rawPage : DEFAULT_PAGE;

  const rawLimit = parsePositiveInt(getSingleParam(raw.limit));
  const limit = rawLimit ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  const statusParam = getSingleParam(raw.status);
  const status = isOrderStatus(statusParam) ? statusParam : undefined;

  const sortByParam = getSingleParam(raw.sortBy);
  const sortBy = isSortBy(sortByParam) ? sortByParam : undefined;

  const sortOrderParam = getSingleParam(raw.sortOrder);
  const sortOrder = isSortOrder(sortOrderParam) ? sortOrderParam : undefined;

  const createdAfter = parseOptionalIsoDate(getSingleParam(raw.createdAfter));
  const createdBefore = parseOptionalIsoDate(getSingleParam(raw.createdBefore));

  let minAmount = parseNonNegativeNumber(getSingleParam(raw.minAmount));
  let maxAmount = parseNonNegativeNumber(getSingleParam(raw.maxAmount));

  if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
    minAmount = undefined;
    maxAmount = undefined;
  }

  const filters: ShopperOrderListQuery = {
    page,
    limit,
  };

  if (status !== undefined) {
    filters.status = status;
  }
  if (sortBy !== undefined) {
    filters.sortBy = sortBy;
  }
  if (sortOrder !== undefined) {
    filters.sortOrder = sortOrder;
  }
  if (createdAfter !== undefined) {
    filters.createdAfter = createdAfter;
  }
  if (createdBefore !== undefined) {
    filters.createdBefore = createdBefore;
  }
  if (minAmount !== undefined) {
    filters.minAmount = minAmount;
  }
  if (maxAmount !== undefined) {
    filters.maxAmount = maxAmount;
  }

  return filters;
}

/**
 * Builds a shopper `/orders` href from list filters, omitting default page/limit.
 */
export function buildOrderListHref(
  filters: Partial<ShopperOrderListQuery>,
): Route {
  const sp = new URLSearchParams();

  if (filters.status) {
    sp.set('status', filters.status);
  }
  if (filters.sortBy) {
    sp.set('sortBy', filters.sortBy);
  }
  if (filters.sortOrder) {
    sp.set('sortOrder', filters.sortOrder);
  }
  if (filters.createdAfter) {
    sp.set('createdAfter', filters.createdAfter);
  }
  if (filters.createdBefore) {
    sp.set('createdBefore', filters.createdBefore);
  }
  if (filters.minAmount !== undefined) {
    sp.set('minAmount', String(filters.minAmount));
  }
  if (filters.maxAmount !== undefined) {
    sp.set('maxAmount', String(filters.maxAmount));
  }
  if (filters.limit !== undefined && filters.limit !== DEFAULT_LIMIT) {
    sp.set('limit', String(filters.limit));
  }
  if (filters.page !== undefined && filters.page > DEFAULT_PAGE) {
    sp.set('page', String(filters.page));
  }

  const qs = sp.toString();
  return (qs ? `/orders?${qs}` : '/orders') as Route;
}

export function buildOrderDetailHref(orderId: number): Route {
  return `/orders/${orderId}` as Route;
}

export const ORDERS_LIST_HREF: Route = '/orders';
