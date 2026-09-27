import { describe, expect, it } from 'vitest';
import { matchAddressField } from './match-address-field';

describe('matchAddressField', () => {
  it('matches field names in validation lines', () => {
    expect(matchAddressField('street must be longer than or equal to 1 characters')).toBe(
      'street',
    );
    expect(matchAddressField('postalCode is not a valid postal code')).toBe(
      'postalCode',
    );
    expect(matchAddressField('country must be a 2-letter ISO code')).toBe(
      'country',
    );
  });

  it('prefers street2 over street when both could match', () => {
    expect(matchAddressField('street2 must be a string')).toBe('street2');
  });

  it('matches deliveryInstructions and isDefault', () => {
    expect(
      matchAddressField('deliveryInstructions must be shorter than or equal to 500 characters'),
    ).toBe('deliveryInstructions');
    expect(matchAddressField('isDefault must be a boolean value')).toBe(
      'isDefault',
    );
  });

  it('returns null for unmapped validation lines', () => {
    expect(matchAddressField('unexpected server error')).toBeNull();
    expect(matchAddressField('internal exception')).toBeNull();
  });
});
