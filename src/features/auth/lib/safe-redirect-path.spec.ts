import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '@/features/auth/lib/safe-redirect-path';

describe('safeRedirectPath', () => {
  it('keeps safe same-origin paths including search and hash', () => {
    expect(safeRedirectPath('/products?page=2#results')).toBe(
      '/products?page=2#results',
    );
  });

  it.each([
    null,
    undefined,
    '',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
  ])('rejects unsafe target %s', (target) => {
    expect(safeRedirectPath(target)).toBe('/');
  });

  it.each([
    '/login',
    '/login?redirect=/account',
    '/login/help',
    '/register',
    '/register/start',
    '/change-password',
    '/change-password?redirect=/',
  ])('rejects auth redirect loop %s', (target) => {
    expect(safeRedirectPath(target)).toBe('/');
  });
});
