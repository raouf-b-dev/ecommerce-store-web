import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatOptionalText,
  formatShipping,
  formatStatusLabel,
  shippingSentence,
} from '@/lib/format';

describe('format', () => {
  it('formats money in en-US when currency is valid', () => {
    expect(formatMoney(10, 'USD')).toBe('$10.00');
  });

  it('falls back when currency is missing or invalid', () => {
    expect(formatMoney(10, null)).toBe('10');
    expect(formatMoney(10, undefined)).toBe('10');
    expect(formatMoney(10, 'not-a-code')).toBe('10 not-a-code');
  });

  it('returns a dash for empty dates and passes through invalid strings', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDateTime(undefined)).toBe('-');
    expect(formatDate('not-a-date')).toBe('not-a-date');
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
  });

  it('formats valid ISO dates in en-US', () => {
    expect(formatDate('2025-01-15T00:00:00.000Z')).not.toBe(
      '2025-01-15T00:00:00.000Z',
    );
    const formatted = formatDateTime('2025-01-15T12:00:00.000Z');
    expect(formatted).toMatch(
      /^[A-Z][a-z]{2} \d{1,2}, 2025, \d{1,2}:\d{2}\s(AM|PM)$/,
    );
    expect(formatted).not.toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it('shows free shipping for zero and the amount otherwise', () => {
    expect(formatShipping(0, 'USD')).toBe('Free');
    expect(formatShipping(5, 'USD')).toBe('$5.00');
    expect(shippingSentence(0, 'USD')).toBe('Shipping is free on this order.');
    expect(shippingSentence(5, 'USD')).toBe('Shipping on this order is $5.00.');
  });

  it('humanizes status codes', () => {
    expect(formatStatusLabel('NEEDS_ATTENTION')).toBe('NEEDS ATTENTION');
  });

  it('formats optional text as a dash when null or blank', () => {
    expect(formatOptionalText(null)).toBe('-');
    expect(formatOptionalText('   ')).toBe('-');
    expect(formatOptionalText('  SKU-1 ')).toBe('SKU-1');
  });
});
