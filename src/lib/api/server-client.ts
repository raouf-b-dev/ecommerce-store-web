// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import 'server-only';

import createClient from 'openapi-fetch';
import { API_BASE_URL } from '@/lib/api/api-base-url';
import type { paths } from '@/lib/api/generated/schema';

async function mockAwareFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  // Inline env gate so production builds can drop the mock sync chunk.
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true') {
    const { syncNodeMockHandlers } = await import(
      '@/lib/mock/sync-node-handlers'
    );
    await syncNodeMockHandlers();
  }

  return fetch(input, init);
}

export const serverClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  fetch: mockAwareFetch,
});
