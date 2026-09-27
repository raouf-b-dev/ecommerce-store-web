import { setupServer } from 'msw/node';
import { handlers } from '@/lib/mock/handlers';
import { registerNodeMockServer } from '@/lib/mock/sync-node-handlers';

export const server = setupServer(...handlers);

let started = false;

/**
 * Start the Node interceptor for RSC / serverClient fetch.
 * Called once from `scripts/mock-server-preload.mjs` (via `dev:mock`), not from
 * `instrumentation.ts` - Next's instrumentation hook is too late / unreliable
 * for patching fetch before the first App Router request.
 *
 * Handler bodies are refreshed from Next's module graph on each mocked
 * serverClient request via `syncNodeMockHandlers` (preload does not HMR).
 */
export function startMockServer(): void {
  if (started) {
    return;
  }
  started = true;
  registerNodeMockServer(server);
  server.listen({ onUnhandledRequest: 'bypass' });
}
