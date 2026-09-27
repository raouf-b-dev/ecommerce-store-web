/**
 * Builds a deterministic, normalized canonical URL.
 *
 * @param origin - The storefront origin (e.g., https://storefront.test)
 * @param pathname - The route pathname (e.g., / or /products/1)
 * @param params - Allowlisted query parameters to format and append
 * @returns Fully qualified, normalized canonical URL string
 */
export function buildCanonicalUrl(
  origin: string,
  pathname: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (!params) {
    return `${cleanOrigin}${cleanPath}`;
  }

  const searchParams = new URLSearchParams();
  const sortedKeys = Object.keys(params).sort();

  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null) {
      const stringValue = String(value).trim();
      if (stringValue.length > 0) {
        searchParams.set(key, stringValue);
      }
    }
  }

  const queryString = searchParams.toString();
  return queryString
    ? `${cleanOrigin}${cleanPath}?${queryString}`
    : `${cleanOrigin}${cleanPath}`;
}
