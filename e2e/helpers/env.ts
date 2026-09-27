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
