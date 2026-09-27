import { describe, it, expect } from 'vitest';
import { matchCheckoutField } from './match-checkout-field';

describe('matchCheckoutField', () => {
  it('matches full path validation lines', () => {
    expect(matchCheckoutField('shippingAddress.street must be a string')).toBe(
      'shippingAddress.street',
    );
    expect(
      matchCheckoutField('shippingAddress.postalCode is not a valid postal code'),
    ).toBe('shippingAddress.postalCode');
  });

  it('matches property names in class-validator message format', () => {
    expect(matchCheckoutField('city must be longer than or equal to 1 characters')).toBe(
      'shippingAddress.city',
    );
    expect(matchCheckoutField('country must be a 2-letter ISO code')).toBe(
      'shippingAddress.country',
    );
    expect(matchCheckoutField('customerNotes must be a string')).toBe(
      'customerNotes',
    );
  });

  it('returns null for unmapped or generic validation lines', () => {
    expect(matchCheckoutField('payment gateway error')).toBeNull();
    expect(matchCheckoutField('internal server exception')).toBeNull();
  });
});
