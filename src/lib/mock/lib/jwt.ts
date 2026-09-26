// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

type MockJwtPayload = {
  sub: string;
  email: string;
  role: string;
};

function base64UrlEncode(value: string): string {
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(value)
      : Buffer.from(value, 'utf8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function createMockJwt(payload: MockJwtPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}
