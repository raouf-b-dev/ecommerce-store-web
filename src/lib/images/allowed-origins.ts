export type ImageRemotePattern = {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
};

/**
 * Shared allowlist for next/image remotePatterns and ProductImage origin checks.
 * Dev always includes the local API. Production hosts come from
 * NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS (comma-separated hostnames, optional :port).
 */
export function getConfiguredImageRemotePatterns(): ImageRemotePattern[] {
  const patterns: ImageRemotePattern[] = [];

  if (process.env.NODE_ENV !== 'production') {
    patterns.push(
      { protocol: 'http', hostname: 'localhost', port: '3000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '3000' },
    );
  }

  const raw = process.env.NEXT_PUBLIC_IMAGE_ALLOWED_HOSTS ?? '';
  for (const entry of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    try {
      const withScheme = entry.includes('://') ? entry : `https://${entry}`;
      const parsed = new URL(withScheme);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        continue;
      }
      patterns.push({
        protocol: parsed.protocol === 'http:' ? 'http' : 'https',
        hostname: parsed.hostname,
        ...(parsed.port ? { port: parsed.port } : {}),
      });
    } catch {
      // skip malformed entries
    }
  }

  return patterns;
}

const SAME_ORIGIN_PROBE = 'http://same-origin.invalid';

/**
 * Root-relative paths are files in this app's `public/` and are always allowed.
 * Resolving against a probe origin catches `//host` and `/\host`, which
 * browsers treat as another origin.
 */
function isRootRelativePath(urlStr: string): boolean {
  if (!urlStr.startsWith('/')) {
    return false;
  }
  try {
    return new URL(urlStr, SAME_ORIGIN_PROBE).origin === SAME_ORIGIN_PROBE;
  } catch {
    return false;
  }
}

export function isAllowedImageOrigin(urlStr: string): boolean {
  if (isRootRelativePath(urlStr)) {
    return true;
  }
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    return getConfiguredImageRemotePatterns().some((pattern) => {
      if (pattern.protocol !== parsed.protocol.replace(':', '')) {
        return false;
      }
      if (pattern.hostname !== parsed.hostname) {
        return false;
      }
      if (pattern.port !== undefined && pattern.port !== parsed.port) {
        return false;
      }
      return true;
    });
  } catch {
    return false;
  }
}
