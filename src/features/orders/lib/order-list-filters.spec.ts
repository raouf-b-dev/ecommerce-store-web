// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  buildOrderListHref,
  parseOrderListFilters,
} from './order-list-filters';

describe('parseOrderListFilters', () => {
  it('returns defaults for empty search params', () => {
    expect(parseOrderListFilters({})).toEqual({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
    });
  });

  it('parses a valid status', () => {
    expect(parseOrderListFilters({ status: 'confirmed' }).status).toBe(
      'confirmed',
    );
  });

  it('ignores invalid status values', () => {
    expect(
      parseOrderListFilters({ status: 'not-a-status' }).status,
    ).toBeUndefined();
  });

  it('ignores admin identity filters', () => {
    const parsed = parseOrderListFilters({
      userId: '99',
      userEmail: 'admin@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      userName: 'ada',
      status: 'shipped',
      page: '2',
    });

    expect(parsed).toEqual({
      page: 2,
      limit: DEFAULT_LIMIT,
      status: 'shipped',
    });
    expect(parsed).not.toHaveProperty('userId');
    expect(parsed).not.toHaveProperty('userEmail');
    expect(parsed).not.toHaveProperty('firstName');
    expect(parsed).not.toHaveProperty('lastName');
    expect(parsed).not.toHaveProperty('userName');
  });

  it('clamps limit and falls back for invalid page', () => {
    expect(parseOrderListFilters({ limit: '250' }).limit).toBe(100);
    expect(parseOrderListFilters({ page: '0' }).page).toBe(DEFAULT_PAGE);
  });
});

describe('buildOrderListHref', () => {
  it('returns /orders when only defaults are provided', () => {
    expect(buildOrderListHref({ page: 1, limit: 10 })).toBe('/orders');
  });

  it('includes non-default filters in the query string', () => {
    expect(
      buildOrderListHref({
        status: 'confirmed',
        page: 2,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      }),
    ).toBe(
      '/orders?status=confirmed&sortBy=createdAt&sortOrder=asc&limit=20&page=2',
    );
  });
});
