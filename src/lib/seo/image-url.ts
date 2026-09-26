// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Validates that an image URL is a non-empty string with an absolute HTTP or HTTPS protocol.
 * Rejects relative paths, javascript: URIs, data URIs, and malformed strings.
 */
export function isValidAbsoluteHttpUrl(
  url: string | null | undefined,
): url is string {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
