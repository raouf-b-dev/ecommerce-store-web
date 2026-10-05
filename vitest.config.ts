import { fileURLToPath } from 'node:url';
import babel from '@babel/core';
import react from '@vitejs/plugin-react';
import { createFilter, type PluginOption } from 'vite';
import { defineConfig } from 'vitest/config';


function reactCompiler(): PluginOption {
  const filter = createFilter(
    'src/features/**/*.{jsx,tsx}',
    '**/node_modules/**',
  );

  return {
    name: 'babel-plugin-react-compiler',
    enforce: 'pre',
    transform(code, id) {
      if (!filter(id)) {
        return;
      }
      const result = babel.transformSync(code, {
        filename: id,
        plugins: ['babel-plugin-react-compiler'],
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        },
      });
      if (!result) return;
      return {
        code: result.code ?? code,
      };
    },
  };
}

export default defineConfig({
  plugins: [reactCompiler(), react()],
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
