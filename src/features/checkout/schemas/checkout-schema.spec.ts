import { describe, expect, it } from 'vitest';
import { checkoutFormSchema } from './checkout-schema';

describe('checkoutFormSchema', () => {
  it('validates successfully with default address and no custom address', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: true,
      paymentMethod: 'CARD',
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        useDefaultAddress: true,
        paymentMethod: 'CARD',
      },
    });
  });

  it('fails validation when useDefaultAddress is false and address fields are missing', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: false,
      paymentMethod: 'CARD',
      shippingAddress: {},
    });

    expect(result.success).toBe(false);
    const paths = !result.success
      ? result.error.issues.map((i) => i.path.join('.'))
      : [];
    expect(paths).toEqual(
      expect.arrayContaining([
        'shippingAddress.firstName',
        'shippingAddress.lastName',
        'shippingAddress.street',
        'shippingAddress.city',
        'shippingAddress.state',
        'shippingAddress.postalCode',
        'shippingAddress.country',
      ]),
    );
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

    expect(result).toMatchObject({
      success: true,
      data: {
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
      },
    });
  });

  it('rejects legacy payment method', () => {
    const result = checkoutFormSchema.safeParse({
      useDefaultAddress: true,
      paymentMethod: 'STRIPE',
    });

    expect(result.success).toBe(false);
    const paths = !result.success
      ? result.error.issues.map((i) => i.path.join('.'))
      : [];
    expect(paths).toEqual(expect.arrayContaining(['paymentMethod']));
  });
});
