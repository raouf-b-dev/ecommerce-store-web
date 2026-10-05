import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Production `reactCompiler: true` on React 19 uses babel-plugin-react-compiler
// with infer mode, the default target, and anonymous function names off.
// The preset only applies to consumer "client", but Vitest transforms tests in
// the "__vitest__" environment, whose consumer is "server".
const compilerPreset = reactCompilerPreset({
  environment: { enableNameAnonymousFunctions: false },
});

compilerPreset.rolldown.applyToEnvironmentHook = (environment) =>
  environment.config.consumer === 'client' || environment.name === '__vitest__';

export default defineConfig({
  plugins: [react(), babel({ presets: [compilerPreset] })],
  environments: {
    __vitest__: {},
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    exclude: ['e2e/**'],
  },
});
