import { API_BASE_URL } from '../api/api-base-url';

export type ImageRemotePattern = {
  protocol: 'http' | 'https';
  hostname: string;
  port: string;
};

export type ImageLocalPattern = {
  pathname: string;
  search: '';
};

/**
 * `public/` folders that next/image may optimize. Only trailing `/**` globs
 * are supported so ProductImage can mirror Next's matching exactly.
 */
export const IMAGE_LOCAL_PATTERNS: ImageLocalPattern[] = [
  { pathname: '/shop/**', search: '' },
  { pathname: '/mock/products/**', search: '' },
];

function parseUrl(value: string, base?: string): URL | null {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

function toRemotePattern(origin: string): ImageRemotePattern {
  const parsed = parseUrl(
    origin.includes('://') ? origin : `https://${origin}`,
  );
  if (
    !parsed ||
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      `Invalid image origin "${origin}": expected [http(s)://]host[:port] with no path, query, or credentials.`,
    );
  }
  return {
    protocol: parsed.protocol === 'http:' ? 'http' : 'https',
    hostname: parsed.hostname,
    port: parsed.port,
  };
}

/**
 * Shared allowlist for next/image remotePatterns and ProductImage origin checks:
 * the API origin plus NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS (comma-separated
 * `[scheme://]host[:port]`, https assumed). Invalid entries throw, so a bad
 * value fails `next build` / `next dev` instead of silently hiding images.
 */
export function getConfiguredImageRemotePatterns(): ImageRemotePattern[] {
  const extraOrigins = (process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const patterns = new Map<string, ImageRemotePattern>();
  for (const origin of [new URL(API_BASE_URL).origin, ...extraOrigins]) {
    const pattern = toRemotePattern(origin);
    patterns.set(
      `${pattern.protocol}://${pattern.hostname}:${pattern.port}`,
      pattern,
    );
  }
  return [...patterns.values()];
}

function matchesPrefixGlob(glob: string, pathname: string): boolean {
  const prefix = glob.slice(0, -'**'.length);
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}

const SAME_ORIGIN_PROBE = 'http://same-origin.invalid';

/**
 * Root-relative paths are files in this app's `public/`. Resolving against a
 * probe origin catches `//host` and `/\host`, which browsers treat as another
 * origin.
 */
function isAllowedLocalPath(urlStr: string): boolean {
  const parsed = parseUrl(urlStr, SAME_ORIGIN_PROBE);
  return (
    parsed?.origin === SAME_ORIGIN_PROBE &&
    IMAGE_LOCAL_PATTERNS.some(
      (pattern) =>
        parsed.search === pattern.search &&
        matchesPrefixGlob(pattern.pathname, parsed.pathname),
    )
  );
}

export function isAllowedImageOrigin(urlStr: string): boolean {
  if (urlStr.startsWith('/')) {
    return isAllowedLocalPath(urlStr);
  }
  const parsed = parseUrl(urlStr);
  if (!parsed) {
    return false;
  }
  return getConfiguredImageRemotePatterns().some(
    (pattern) =>
      pattern.protocol === parsed.protocol.replace(':', '') &&
      pattern.hostname === parsed.hostname &&
      pattern.port === parsed.port,
  );
}
