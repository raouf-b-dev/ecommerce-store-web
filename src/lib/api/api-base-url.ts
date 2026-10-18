declare global {
  interface Window {
    /** Set by /runtime-config.js (src/app/runtime-config.js/route.ts) before hydration. */
    __STOREFRONT_CONFIG__?: { apiBaseUrl?: string };
  }
}

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  const url = new URL(trimmed);

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error(
      `Invalid protocol or missing hostname in API base URL: ${trimmed}`,
    );
  }

  return trimmed;
}

function configured(value: string | undefined): string | null {
  return value && value.trim() ? value : null;
}

/**
 * Build-time API origin (NEXT_PUBLIC_API_BASE_URL, inlined by `next build`).
 * next/image remotePatterns and ProductImage use it.
 */
export function getApiBaseUrl(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const raw = configured(process.env.NEXT_PUBLIC_API_BASE_URL);

  if (isProd && !raw) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL must be configured in production.',
    );
  }

  return normalizeApiBaseUrl(raw ?? 'http://localhost:3000');
}

export const API_BASE_URL = getApiBaseUrl();

/** API origin the browser calls: runtime API_BASE_URL, else the build-time origin. */
export function getPublicApiBaseUrl(): string {
  const runtime = configured(process.env.API_BASE_URL);
  return runtime ? normalizeApiBaseUrl(runtime) : API_BASE_URL;
}

/** Browser side: the value /runtime-config.js set, else the build-time origin. */
export function getBrowserApiBaseUrl(): string {
  const runtime = configured(
    globalThis.window?.__STOREFRONT_CONFIG__?.apiBaseUrl,
  );
  return runtime ? normalizeApiBaseUrl(runtime) : API_BASE_URL;
}

/**
 * Server-side fetches: runtime API_INTERNAL_BASE_URL (for example
 * http://api:3000 inside a Compose network), else the public origin.
 */
export function getServerApiBaseUrl(): string {
  const internal = configured(process.env.API_INTERNAL_BASE_URL);
  return internal ? normalizeApiBaseUrl(internal) : getPublicApiBaseUrl();
}
