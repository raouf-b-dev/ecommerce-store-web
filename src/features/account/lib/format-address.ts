// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { AddressResponseDto } from '@/features/account/types';

/** Multi-line display: street, optional street2, city/state/postal, country. */
export function formatAddressLines(address: AddressResponseDto): string[] {
  const lines: string[] = [address.street];

  if (address.street2?.trim()) {
    lines.push(address.street2.trim());
  }

  lines.push(`${address.city}, ${address.state} ${address.postalCode}`);
  lines.push(address.country);

  return lines;
}

/** Compact single-line display for previews and summaries. */
export function formatAddressOneLine(address: AddressResponseDto): string {
  return formatAddressLines(address).join(', ');
}
