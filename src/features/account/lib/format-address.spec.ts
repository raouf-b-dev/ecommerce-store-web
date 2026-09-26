// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { formatAddressLines, formatAddressOneLine } from './format-address';
import { createMockAddress } from '@/test/fixtures/account.fixture';

describe('formatAddressLines', () => {
  it('returns street, city/state/postal, and country lines', () => {
    const address = createMockAddress({ street2: undefined });

    expect(formatAddressLines(address)).toEqual([
      '123 Main Street',
      'New York, NY 10001',
      'US',
    ]);
  });

  it('includes trimmed street2 when present', () => {
    const address = createMockAddress({ street2: '  Apt 4B  ' });

    expect(formatAddressLines(address)).toEqual([
      '123 Main Street',
      'Apt 4B',
      'New York, NY 10001',
      'US',
    ]);
  });

  it('omits blank street2', () => {
    const address = createMockAddress({ street2: '   ' });

    expect(formatAddressLines(address)).toEqual([
      '123 Main Street',
      'New York, NY 10001',
      'US',
    ]);
  });
});

describe('formatAddressOneLine', () => {
  it('joins address lines with commas', () => {
    const address = createMockAddress();

    expect(formatAddressOneLine(address)).toBe(
      '123 Main Street, Apt 4B, New York, NY 10001, US',
    );
  });
});
