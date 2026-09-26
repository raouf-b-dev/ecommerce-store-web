// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** Unsigned JWT for expiry and claim tests. It is not a credential. */
export function createTestJwt(payload: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

export function createCustomerAccessToken(
  overrides: Record<string, unknown> = {},
): string {
  return createTestJwt({
    sub: '42',
    email: 'customer@example.com',
    role: 'CUSTOMER',
    ...overrides,
  });
}
