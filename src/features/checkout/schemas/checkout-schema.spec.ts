import { describe, expect, it } from 'vitest';
import { checkoutFormSchema } from './checkout-schema';

describe('checkoutFormSchema', () => {
  it('validates successfully with default address and no custom address', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: true,
      paymentMethod: 'STRIPE',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.useDefaultAddress).toBe(true);
      expect(result.data.paymentMethod).toBe('STRIPE');
    }
  });

  it('fails validation when useDefaultAddress is false and address fields are missing', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: false,
      paymentMethod: 'STRIPE',
      shippingAddress: {},
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('shippingAddress.firstName');
      expect(paths).toContain('shippingAddress.lastName');
      expect(paths).toContain('shippingAddress.street');
      expect(paths).toContain('shippingAddress.city');
      expect(paths).toContain('shippingAddress.state');
      expect(paths).toContain('shippingAddress.postalCode');
      expect(paths).toContain('shippingAddress.country');
    }
  });

  it('validates successfully when useDefaultAddress is false and all required address fields are provided', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: false,
      paymentMethod: 'STRIPE',
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
});
