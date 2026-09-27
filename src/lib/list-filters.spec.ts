import { describe, expect, it } from 'vitest';
import {
  parseIsActiveParam,
  parseNonNegativeNumber,
  parsePositiveInt,
} from '@/lib/list-filters';

describe('list-filters', () => {
  it('parses positive integers', () => {
    expect(parsePositiveInt('3')).toBe(3);
    expect(parsePositiveInt(1)).toBe(1);
    expect(parsePositiveInt('0')).toBeUndefined();
    expect(parsePositiveInt('-2')).toBeUndefined();
    expect(parsePositiveInt('1.5')).toBeUndefined();
    expect(parsePositiveInt('nope')).toBeUndefined();
    expect(parsePositiveInt('')).toBeUndefined();
    expect(parsePositiveInt('   ')).toBeUndefined();
    expect(parsePositiveInt(null)).toBeUndefined();
    expect(parsePositiveInt(undefined)).toBeUndefined();
  });

  it('parses non-negative numbers', () => {
    expect(parseNonNegativeNumber('0')).toBe(0);
    expect(parseNonNegativeNumber(0)).toBe(0);
    expect(parseNonNegativeNumber('2.5')).toBe(2.5);
    expect(parseNonNegativeNumber(-1)).toBeUndefined();
    expect(parseNonNegativeNumber('nope')).toBeUndefined();
    expect(parseNonNegativeNumber('')).toBeUndefined();
    expect(parseNonNegativeNumber('   ')).toBeUndefined();
    expect(parseNonNegativeNumber(null)).toBeUndefined();
    expect(parseNonNegativeNumber(undefined)).toBeUndefined();
  });

  it('parses isActive query flags', () => {
    expect(parseIsActiveParam('true')).toBe(true);
    expect(parseIsActiveParam('1')).toBe(true);
    expect(parseIsActiveParam('false')).toBe(false);
    expect(parseIsActiveParam('0')).toBe(false);
    expect(parseIsActiveParam('yes')).toBeUndefined();
    expect(parseIsActiveParam(null)).toBeUndefined();
  });
});
