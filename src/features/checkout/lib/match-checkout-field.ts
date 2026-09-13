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
  const lower = validationLine.toLowerCase();

  // 1. Exact full-path match first (e.g. "shippingAddress.postalCode must be...")
  for (const field of CHECKOUT_FIELDS) {
    if (lower.includes(field.toLowerCase())) {
      return field;
    }
  }

  // 2. Bare property name match only when class-validator emits bare names
  for (const field of CHECKOUT_FIELDS) {
    const propName = field.includes('.') ? field.split('.')[1]! : field;
    const propLower = propName.toLowerCase();
    if (
      lower.includes(` ${propLower} `) ||
      lower.startsWith(`${propLower} `) ||
      lower.endsWith(` ${propLower}`) ||
      lower.includes(`.${propLower}`)
    ) {
      return field;
    }
  }

  return null;
}
