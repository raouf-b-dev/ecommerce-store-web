export function getApiBaseUrl(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (isProd && (!raw || !raw.trim())) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL must be configured in production.',
    );
  }

  const effective = raw && raw.trim() ? raw.trim() : 'http://localhost:3000';
  const trimmed = effective.replace(/\/+$/, '');
  const url = new URL(trimmed);

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error(
      `Invalid protocol or missing hostname in API base URL: ${trimmed}`,
    );
  }

  return trimmed;
}

export const API_BASE_URL = getApiBaseUrl();
