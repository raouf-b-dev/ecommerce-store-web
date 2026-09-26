// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
  addAddressFormSchema,
  updateAddressFormSchema,
} from './address-schema';

const validAddress = {
  street: '123 Main Street',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'us',
};

describe('addAddressFormSchema', () => {
  it('accepts a valid address and uppercases country', () => {
    const result = addAddressFormSchema.safeParse({
      ...validAddress,
      isDefault: true,
      type: 'HOME',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toBe('US');
      expect(result.data.isDefault).toBe(true);
    }
  });

  it('rejects missing required fields', () => {
    const result = addAddressFormSchema.safeParse({
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.street).toContain('Street address is required');
      expect(errors.city).toContain('City is required');
      expect(errors.state).toContain('State or province is required');
      expect(errors.postalCode).toContain('Postal code is required');
      expect(errors.country).toBeDefined();
    }
  });

  it('rejects country codes that are not exactly 2 letters', () => {
    const result = addAddressFormSchema.safeParse({
      ...validAddress,
      country: 'USA',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.country).toContain(
        'Country must be a 2-letter ISO code',
      );
    }
  });

  it('allows optional isDefault on add', () => {
    const withFlag = addAddressFormSchema.safeParse({
      ...validAddress,
      isDefault: false,
    });
    const withoutFlag = addAddressFormSchema.safeParse(validAddress);

    expect(withFlag.success).toBe(true);
    expect(withoutFlag.success).toBe(true);
  });
});

describe('updateAddressFormSchema', () => {
  it('accepts required fields and uppercases country without isDefault', () => {
    const result = updateAddressFormSchema.safeParse(validAddress);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toBe('US');
      expect(
        Object.prototype.hasOwnProperty.call(result.data, 'isDefault'),
      ).toBe(false);
    }
  });

  it('strips unknown isDefault rather than requiring it', () => {
    const result = updateAddressFormSchema.safeParse({
      ...validAddress,
      isDefault: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        Object.prototype.hasOwnProperty.call(result.data, 'isDefault'),
      ).toBe(false);
    }
  });
});
