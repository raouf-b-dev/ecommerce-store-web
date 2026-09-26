// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
  getChangePasswordRedirectPath,
  getLoginRedirectPath,
  getRegisterRedirectPath,
  navigateAfterLoginPath,
} from '@/lib/auth/auth-routes';
import type { AuthSession } from '@/lib/auth/types';

const cleanSession: AuthSession = {
  userId: '42',
  email: 'shopper@example.com',
  role: 'CUSTOMER',
  permissions: [],
  mustChangePassword: false,
};

describe('navigateAfterLoginPath', () => {
  it('preserves a safe destination for a clean session', () => {
    expect(
      navigateAfterLoginPath(cleanSession, '/account?tab=orders'),
    ).toBe('/account?tab=orders');
  });

  it('carries the safe destination through forced rotation', () => {
    expect(
      navigateAfterLoginPath(
        { ...cleanSession, mustChangePassword: true },
        '/account?tab=orders',
      ),
    ).toBe(
      '/change-password?redirect=%2Faccount%3Ftab%3Dorders',
    );
  });

  it('rejects external and authentication-loop destinations', () => {
    const flagged = { ...cleanSession, mustChangePassword: true };
    expect(navigateAfterLoginPath(flagged, '//evil.example')).toBe(
      '/change-password?redirect=%2F',
    );
    expect(navigateAfterLoginPath(flagged, '/change-password')).toBe(
      '/change-password?redirect=%2F',
    );
  });
});

describe('auth route builders', () => {
  it('builds sanitized login and registration redirects', () => {
    expect(getLoginRedirectPath('/account?tab=orders')).toBe(
      '/login?redirect=%2Faccount%3Ftab%3Dorders',
    );
    expect(getLoginRedirectPath('/account?tab=orders#history')).toBe(
      '/login?redirect=%2Faccount%3Ftab%3Dorders%23history',
    );
    expect(getRegisterRedirectPath('/account?tab=orders')).toBe(
      '/register?redirect=%2Faccount%3Ftab%3Dorders',
    );
    expect(getLoginRedirectPath('//evil.example')).toBe(
      '/login?redirect=%2F',
    );
  });

  it('builds a sanitized forced-password redirect', () => {
    expect(
      getChangePasswordRedirectPath('/products?category=books#results'),
    ).toBe(
      '/change-password?redirect=%2Fproducts%3Fcategory%3Dbooks%23results',
    );
    expect(getChangePasswordRedirectPath('/change-password')).toBe(
      '/change-password?redirect=%2F',
    );
  });
});
