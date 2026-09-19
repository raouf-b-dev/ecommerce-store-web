import { matchField } from '@/lib/forms/match-field';

export const CHECKOUT_FIELDS = [
  'shippingAddress.firstName',
  'shippingAddress.lastName',
  'shippingAddress.street',
  'shippingAddress.street2',
  'shippingAddress.city',
  'shippingAddress.state',
  'shippingAddress.postalCode',
  'shippingAddress.country',
  'shippingAddress.phone',
  'shippingAddress.deliveryInstructions',
  'customerNotes',
] as const;

export type CheckoutFormField = (typeof CHECKOUT_FIELDS)[number];

export function matchCheckoutField(
  validationLine: string,
): CheckoutFormField | null {
  return matchField(CHECKOUT_FIELDS, validationLine);
}
