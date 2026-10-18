import { test } from '@playwright/test';

/** Fail closed in CI; skip locally when a seeded-secret test needs env. */
export function skipUnlessEnv(...names: string[]): void {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length === 0) {
    return;
  }

  const list = missing.join(', ');
  if (process.env.CI) {
    throw new Error(`CI e2e requires ${list} (see e2e/README.md).`);
  }
  test.skip(true, `Set ${list} (see e2e/README.md).`);
}

/**
 * The forced-password spec is one-shot: the API seed sets the flag, and
 * changing the password clears it. No storefront request can set it again.
 * CI seeds a fresh database, so a missing flag there is a broken precondition.
 * A long-lived local database skips until `npm run db:seed:auth` is run there.
 */
export function skipUnlessForcedPasswordChange(): void {
  const message =
    'Seeded customer is not required to change password. Run `npm run db:seed:auth` against the API database, then run this suite again (see e2e/README.md).';
  if (process.env.CI) {
    throw new Error(message);
  }
  test.skip(true, message);
}

/** `skipUnlessEnv` already aborted when this is missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} (see e2e/README.md).`);
  }
  return value;
}

/**
 * API origin for direct e2e requests. Same development default as
 * src/lib/api/api-base-url.ts, without its production guard, so loading a spec
 * never throws. CI sets NEXT_PUBLIC_API_BASE_URL.
 */
export const E2E_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'http://localhost:3000';

