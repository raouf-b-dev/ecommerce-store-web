export function getStorefrontOrigin(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const raw = process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN;

  if (isProd && (!raw || !raw.trim())) {
    throw new Error(
      'NEXT_PUBLIC_STOREFRONT_ORIGIN must be configured in production.',
    );
  }

  const effective = raw && raw.trim() ? raw.trim() : 'http://localhost:3100';
  const trimmed = effective.replace(/\/+$/, '');
  const url = new URL(trimmed);

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error(`Invalid protocol or missing hostname in origin: ${trimmed}`);
  }

  // NEXT_PUBLIC_ALLOW_LOOPBACK_ORIGIN=true is the opt-in for local demo images.
  if (
    isProd &&
    process.env.NEXT_PUBLIC_ALLOW_LOOPBACK_ORIGIN !== 'true' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  ) {
    throw new Error(
      'NEXT_PUBLIC_STOREFRONT_ORIGIN cannot be localhost in production.',
    );
  }

  return trimmed;
}
