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

/** Shipping amount as the API returned it; zero reads as "Free". */
export function formatShipping(
  amount: number,
  currency: string | null | undefined,
): string {
  return amount === 0 ? 'Free' : formatMoney(amount, currency);
}

/** The one shipping sentence cart, checkout, and confirmation share. */
export function shippingSentence(
  amount: number,
  currency: string | null | undefined,
): string {
  return amount === 0
    ? 'Shipping is free on this order.'
    : `Shipping on this order is ${formatMoney(amount, currency)}.`;
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
