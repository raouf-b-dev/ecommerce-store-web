// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

const SHOPPER_LOCALE = 'en-US';

/**
 * Presentation-only money formatter. Callers must pass the currency from the API
 * (product.currency, cart.currency, order.currency). Do not invent store currency here.
 */
export function formatMoney(
  amount: number,
  currency: string | null | undefined,
  options?: { maximumFractionDigits?: number },
): string {
  if (currency === null || currency === undefined || currency === '') {
    return String(amount);
  }

  try {
    return new Intl.NumberFormat(SHOPPER_LOCALE, {
      style: 'currency',
      currency,
      maximumFractionDigits: options?.maximumFractionDigits,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(SHOPPER_LOCALE);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(SHOPPER_LOCALE);
}

export function formatStatusLabel(status: string): string {
  return status.replaceAll('_', ' ');
}
