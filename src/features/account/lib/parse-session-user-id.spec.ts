import { describe, expect, it } from 'vitest';
import { parseSessionUserId } from './parse-session-user-id';

describe('parseSessionUserId', () => {
  it('parses a valid positive integer string', () => {
    expect(parseSessionUserId('42')).toBe(42);
  });

  it('returns undefined for empty or whitespace-only values', () => {
    expect(parseSessionUserId('')).toBeUndefined();
    expect(parseSessionUserId('   ')).toBeUndefined();
    expect(parseSessionUserId(null)).toBeUndefined();
    expect(parseSessionUserId(undefined)).toBeUndefined();
  });

  it('returns undefined for malformed or non-positive values', () => {
    expect(parseSessionUserId('abc')).toBeUndefined();
    expect(parseSessionUserId('12.5')).toBeUndefined();
    expect(parseSessionUserId('0')).toBeUndefined();
    expect(parseSessionUserId('-3')).toBeUndefined();
  });
});
