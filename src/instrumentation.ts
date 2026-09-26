// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Intentionally empty for mock mode.
 *
 * Node MSW is started by `scripts/mock-server-preload.mjs` when running
 * `npm run dev:mock` (NODE_OPTIONS `--import`). Starting `setupServer` here as
 * well would register a second interceptor against a separate module graph.
 */
export async function register() {}
