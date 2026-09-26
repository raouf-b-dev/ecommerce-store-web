// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { decodeJwtPayload } from '@/lib/auth/access-token';

export type AccessTokenClaims = {
  sub: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
};

export function decodeAccessTokenClaims(
  token: string,
): AccessTokenClaims | null {
  const decoded = decodeJwtPayload(token);
  if (!decoded) {
    return null;
  }

  if (
    typeof decoded.sub !== 'string' ||
    typeof decoded.email !== 'string' ||
    typeof decoded.role !== 'string'
  ) {
    return null;
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    mustChangePassword: decoded.mustChangePassword === true,
  };
}
