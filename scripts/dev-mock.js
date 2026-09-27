import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(rootDir, '.env.mock');

/**
 * Minimal .env loader for the mock profile. Prefer shell-provided values so
 * `FOO=bar npm run dev:mock` still wins over `.env.mock`.
 */
function loadMockEnv(filePath) {
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadMockEnv(envPath);

const preloadUrl = pathToFileURL(
  path.join(rootDir, 'scripts', 'mock-server-preload.mjs'),
).href;
const existingNodeOptions = process.env.NODE_OPTIONS || '';
process.env.NODE_OPTIONS = `${existingNodeOptions} --import=${preloadUrl}`.trim();

const nextBin = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const args = ['dev', '--port', '3100', ...process.argv.slice(2)];
const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
