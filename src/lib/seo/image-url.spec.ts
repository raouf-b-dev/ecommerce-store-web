// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { isValidAbsoluteHttpUrl } from '@/lib/seo/image-url';

describe('isValidAbsoluteHttpUrl', () => {
  it('accepts valid https and http URLs', () => {
    expect(isValidAbsoluteHttpUrl('https://example.com/image.png')).toBe(true);
    expect(isValidAbsoluteHttpUrl('http://example.com/image.jpg')).toBe(true);
    expect(isValidAbsoluteHttpUrl('  https://cdn.store.local/p/1.webp  ')).toBe(
      true,
    );
  });

  it('rejects relative URLs', () => {
    expect(isValidAbsoluteHttpUrl('/images/product.jpg')).toBe(false);
    expect(isValidAbsoluteHttpUrl('product.jpg')).toBe(false);
  });

  it('rejects dangerous or non-http protocols', () => {
    expect(isValidAbsoluteHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidAbsoluteHttpUrl('data:image/png;base64,...')).toBe(false);
    expect(isValidAbsoluteHttpUrl('ftp://example.com/image.png')).toBe(false);
    expect(isValidAbsoluteHttpUrl('file:///C:/image.png')).toBe(false);
  });

  it('rejects null, undefined, empty, and malformed strings', () => {
    expect(isValidAbsoluteHttpUrl(null)).toBe(false);
    expect(isValidAbsoluteHttpUrl(undefined)).toBe(false);
    expect(isValidAbsoluteHttpUrl('')).toBe(false);
    expect(isValidAbsoluteHttpUrl('   ')).toBe(false);
    expect(isValidAbsoluteHttpUrl('not a url')).toBe(false);
    expect(isValidAbsoluteHttpUrl('https://')).toBe(false);
  });
});
