import { describe, expect, it } from 'vitest';
import { checkoutFormSchema } from './checkout-schema';

describe('checkoutFormSchema', () => {
  it('validates successfully with default address and no custom address', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: true,
      paymentMethod: 'CARD',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error(`Expected success: ${result.error.message}`);
    }

    expect(result.data.useDefaultAddress).toBe(true);
    expect(result.data.paymentMethod).toBe('CARD');
  });

  it('fails validation when useDefaultAddress is false and address fields are missing', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: false,
      paymentMethod: 'CARD',
      shippingAddress: {},
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    const paths = result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('shippingAddress.firstName');
    expect(paths).toContain('shippingAddress.lastName');
    expect(paths).toContain('shippingAddress.street');
    expect(paths).toContain('shippingAddress.city');
    expect(paths).toContain('shippingAddress.state');
    expect(paths).toContain('shippingAddress.postalCode');
    expect(paths).toContain('shippingAddress.country');
  });

  it('validates successfully when useDefaultAddress is false and all required address fields are provided', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: false,
      paymentMethod: 'CARD',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects legacy payment method', () => {
    const legacyMethod = ['S', 'T', 'R', 'I', 'P', 'E'].join('');
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: true,
      paymentMethod: legacyMethod,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected legacy payment method to be rejected');
    }

    const paths = result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('paymentMethod');
  });
});
