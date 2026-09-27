import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatStatusLabel,
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

  it('returns an em dash for empty dates and passes through invalid strings', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDateTime(undefined)).toBe('-');
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('formats valid ISO dates in en-US', () => {
    expect(formatDate('2025-01-15T00:00:00.000Z')).not.toBe(
      '2025-01-15T00:00:00.000Z',
    );
    expect(formatDateTime('2025-01-15T12:00:00.000Z')).not.toBe(
      '2025-01-15T12:00:00.000Z',
    );
  });

  it('humanizes status codes', () => {
    expect(formatStatusLabel('NEEDS_ATTENTION')).toBe('NEEDS ATTENTION');
  });
});
