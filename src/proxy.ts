import { NextResponse, type NextRequest } from 'next/server';
import { validateProductVisibility } from '@/features/catalog/api/validate-product-visibility';

export const config = {
  matcher: ['/products/:id'],
};

const POSITIVE_INT_REGEX = /^\d+$/;

/**
 * Rewrites missing or inactive product requests to Next.js root /_not-found.
 *
 * - Sets `x-not-found-type: product` as a forwarded request header so root
 *   `not-found.tsx` renders the custom ProductNotFound card.
 * - Sets `x-robots-tag: noindex, nofollow` as the outgoing response header.
 */
function rewriteToProductNotFound(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-not-found-type', 'product');

  return NextResponse.rewrite(new URL('/_not-found', request.url), {
    status: 404,
    headers: {
      'x-robots-tag': 'noindex, nofollow',
    },
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Proxy is a supported network-boundary workaround proven for this application
 * to enforce genuine HTTP 404 status codes before Partial Prerendering streams
 * the response.
 */
export async function proxy(request: NextRequest) {
  const method = request.method;

  // 1. Only validate document GET and HEAD requests consistently; bypass other methods
  if (method !== 'GET' && method !== 'HEAD') {
    return NextResponse.next();
  }

  // Extract raw ID segment from pathname (/products/:id)
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const rawId = segments[1];

  // 2. Structural validation: reject non-digits, zero, negative, or decimals immediately
  if (!rawId || !POSITIVE_INT_REGEX.test(rawId)) {
    return rewriteToProductNotFound(request);
  }

  const numId = Number(rawId);
  if (!Number.isInteger(numId) || numId <= 0) {
    return rewriteToProductNotFound(request);
  }

  // 3. Blocking asynchronous product validation before response streaming
  const result = await validateProductVisibility(numId);

  switch (result.status) {
    case 'active':
      return NextResponse.next();

    case 'not_found':
    case 'inactive':
      return rewriteToProductNotFound(request);

    case 'rate_limited':
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: result.retryAfter
          ? { 'retry-after': result.retryAfter }
          : undefined,
      });

    case 'server_error':
      return new NextResponse('Upstream Catalog Error', {
        status: 502,
      });

    case 'timeout':
      return new NextResponse('Catalog Gateway Timeout', {
        status: 504,
      });

    case 'network_error':
      return new NextResponse('Catalog Service Unavailable', {
        status: 503,
      });
  }
}
