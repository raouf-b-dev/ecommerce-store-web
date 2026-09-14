export const ADDRESS_FIELDS = [
  'street2',
  'street',
  'city',
  'state',
  'postalCode',
  'country',
  'type',
  'deliveryInstructions',
  'isDefault',
] as const;

export type AddressFormField = (typeof ADDRESS_FIELDS)[number];

export function matchAddressField(
  validationLine: string,
): AddressFormField | null {
  const lower = validationLine.toLowerCase();

  // 1. Exact field-name match first (street2 before street to avoid prefix false positives)
  for (const field of ADDRESS_FIELDS) {
    if (lower.includes(field.toLowerCase())) {
      return field;
    }
  }

  // 2. Bare property name match only when class-validator emits bare names
  for (const field of ADDRESS_FIELDS) {
    const propLower = field.toLowerCase();
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
