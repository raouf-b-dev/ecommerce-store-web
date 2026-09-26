// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Node-side MSW bootstrap for `npm run dev:mock`.
 *
 * Loaded via NODE_OPTIONS `--import` before Next starts so `setupServer`
 * patches undici/fetch in time for RSC catalog requests. Do not also start
 * MSW from `instrumentation.ts` - that creates a second interceptor instance.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const jiti = createJiti(import.meta.url, {
  alias: {
    '@': path.join(rootDir, 'src'),
  },
});

const { startMockServer } = await jiti.import(
  path.join(rootDir, 'src', 'lib', 'mock', 'server.ts'),
);

startMockServer();
