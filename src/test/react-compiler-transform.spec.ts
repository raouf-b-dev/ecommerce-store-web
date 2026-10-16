import path from 'node:path';
import { createServer, type DevEnvironment } from 'vite';
import { describe, expect, it } from 'vitest';

function isDevEnvironment(value: unknown): value is DevEnvironment {
  if (typeof value !== 'object' || value === null || !('transformRequest' in value)) {
    return false;
  }
  return typeof value.transformRequest === 'function';
}

describe('react compiler transform', () => {
  it('compiles a client component in the vitest environment', async () => {
    const server = await createServer({
      configFile: path.resolve('vitest.config.ts'),
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
    });

    try {
      const environment = server.environments.__vitest__;
      if (!isDevEnvironment(environment)) {
        throw new Error('expected the __vitest__ environment');
      }
      const result = await environment.transformRequest(
        '/src/components/theme/theme-toggle.tsx',
      );
      if (!result) {
        throw new Error('expected a transform result');
      }
      expect(result.code).toContain('react/compiler-runtime');
    } finally {
      await server.close();
    }
  }, 30_000);
});
