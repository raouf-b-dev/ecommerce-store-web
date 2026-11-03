import { describe, expect, it } from 'vitest';
import { hasPlaceholderSupportEmail, shop } from '@/lib/shop';

describe('hasPlaceholderSupportEmail', () => {
  it('is true for the configured shop support address', () => {
    expect(hasPlaceholderSupportEmail()).toBe(true);
    expect(shop.supportEmail).toContain('@example.com');
  });

  it.each([
    'support@example.com',
    'help@example.org',
    'team@example.net',
    'ops@mail.example',
    'desk@shop.test',
  ])('is true for placeholder domain %s', (email) => {
    expect(hasPlaceholderSupportEmail(email)).toBe(true);
  });

  it.each([
    'support@everydaygoods.com',
    'help@storefront.io',
  ])('is false for a real domain %s', (email) => {
    expect(hasPlaceholderSupportEmail(email)).toBe(false);
  });
});
