// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { SetupServer } from 'msw/node';

const GLOBAL_KEY = '__ecommerce_store_web_msw__';

type MswGlobal = typeof globalThis & {
  [GLOBAL_KEY]?: SetupServer;
};

/** Same array reference means handlers module has not been replaced by HMR. */
let lastHandlersRef: unknown;

/**
 * Stash the preload-created MSW server on globalThis so Next's module graph can
 * push fresh handlers via `resetHandlers` (preload itself does not hot-reload).
 */
export function registerNodeMockServer(server: SetupServer): void {
  (globalThis as MswGlobal)[GLOBAL_KEY] = server;
}

/**
 * Replace Node MSW handlers with the current Next-bundled handler module.
 * Called before mocked serverClient fetches. Skips reset when the handlers
 * export is unchanged (avoids per-request full reset cost).
 */
export async function syncNodeMockHandlers(): Promise<void> {
  const server = (globalThis as MswGlobal)[GLOBAL_KEY];
  if (!server) {
    return;
  }

  const { handlers } = await import('@/lib/mock/handlers');
  if (handlers === lastHandlersRef) {
    return;
  }

  lastHandlersRef = handlers;
  server.resetHandlers(...handlers);
}
