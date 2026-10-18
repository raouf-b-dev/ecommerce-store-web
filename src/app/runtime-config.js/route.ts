import { connection } from 'next/server';
import { getPublicApiBaseUrl } from '@/lib/api/api-base-url';

/**
 * Runtime browser config, read per request so one image can serve any API
 * origin (NEXT_PUBLIC_* is frozen at build). Not a BFF: it never calls the API.
 */
export async function GET(): Promise<Response> {
  await connection();
  const config = { apiBaseUrl: getPublicApiBaseUrl() };

  return new Response(
    `window.__STOREFRONT_CONFIG__ = ${JSON.stringify(config)};\n`,
    {
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
}
