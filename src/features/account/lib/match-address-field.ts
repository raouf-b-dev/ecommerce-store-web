// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { matchField } from '@/lib/forms/match-field';

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
  return matchField(ADDRESS_FIELDS, validationLine);
}
