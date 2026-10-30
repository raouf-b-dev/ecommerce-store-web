import type {
  AddressResponseDto,
  AddressType,
} from '@/features/account/types';

/** Shopper-facing label for an address type enum (HOME -> Home). */
export function formatAddressTypeLabel(type: AddressType): string {
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
