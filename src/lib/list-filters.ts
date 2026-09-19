export function parsePositiveInt(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isInteger(n) && n > 0) {
    return n;
  }
  return undefined;
}

export function parseNonNegativeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(n) && n >= 0) {
    return n;
  }
  return undefined;
}

export function parseIsActiveParam(value: string | null): boolean | undefined {
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return undefined;
}
