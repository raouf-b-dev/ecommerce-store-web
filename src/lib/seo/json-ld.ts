/**
 * Safely serializes data to a JSON string for insertion into an HTML
 * <script type="application/ld+json"> tag, escaping dangerous characters
 * that could otherwise terminate the script or permit XSS.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
