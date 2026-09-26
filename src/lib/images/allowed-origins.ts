// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

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

export function isAllowedImageOrigin(urlStr: string): boolean {
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
