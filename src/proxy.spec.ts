import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { proxy } from '@/proxy';
import { validateProductVisibility } from '@/features/catalog/api/validate-product-visibility';
import { createMockProductDetail } from '@/test/fixtures/catalog.fixture';

vi.mock('@/features/catalog/api/validate-product-visibility', () => ({
  validateProductVisibility: vi.fn(),
}));

describe('proxy()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (url: string, method: string = 'GET') => {
    return new NextRequest(new URL(url, 'https://storefront.test'), { method });
  };

  const activeProduct = createMockProductDetail({ id: 8, name: '4K Projector', isActive: true });

  it('bypasses non-GET/HEAD methods', async () => {
    const req = createRequest('/products/8', 'POST');
    const res = await proxy(req);
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(validateProductVisibility).not.toHaveBeenCalled();
  });

  it('rewrites non-numeric ID (/products/abc) to /_not-found with 404', async () => {
    const req = createRequest('/products/abc', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(404);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(res.headers.get('x-middleware-rewrite')).toContain('/_not-found');
    expect(res.headers.get('x-middleware-request-x-not-found-type')).toBe('product');
    expect(validateProductVisibility).not.toHaveBeenCalled();
  });

  it('rewrites zero ID (/products/0) to /_not-found with 404', async () => {
    const req = createRequest('/products/0', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(404);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(res.headers.get('x-middleware-rewrite')).toContain('/_not-found');
    expect(validateProductVisibility).not.toHaveBeenCalled();
  });

  it('rewrites negative ID (/products/-5) to /_not-found with 404', async () => {
    const req = createRequest('/products/-5', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(404);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(res.headers.get('x-middleware-rewrite')).toContain('/_not-found');
    expect(validateProductVisibility).not.toHaveBeenCalled();
  });

  it('validates HEAD requests consistently with GET', async () => {
    const req = createRequest('/products/abc', 'HEAD');
    const res = await proxy(req);

    expect(res.status).toBe(404);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(res.headers.get('x-middleware-rewrite')).toContain('/_not-found');
  });

  it('passes active product with NextResponse.next()', async () => {
    vi.mocked(validateProductVisibility).mockResolvedValueOnce({
      status: 'active',
      product: activeProduct,
    });

    const req = createRequest('/products/8', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(validateProductVisibility).toHaveBeenCalledWith(8);
  });

  it('rewrites missing product (404) to /_not-found with 404', async () => {
    vi.mocked(validateProductVisibility).mockResolvedValueOnce({
      status: 'not_found',
    });

    const req = createRequest('/products/999', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(404);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(res.headers.get('x-middleware-rewrite')).toContain('/_not-found');
    expect(res.headers.get('x-middleware-request-x-not-found-type')).toBe('product');
  });

  it('rewrites inactive product to /_not-found with 404', async () => {
    vi.mocked(validateProductVisibility).mockResolvedValueOnce({
      status: 'inactive',
    });

    const req = createRequest('/products/10', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(404);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(res.headers.get('x-middleware-rewrite')).toContain('/_not-found');
  });

  it('returns 429 Too Many Requests when rate limited', async () => {
    vi.mocked(validateProductVisibility).mockResolvedValueOnce({
      status: 'rate_limited',
      retryAfter: '60',
    });

    const req = createRequest('/products/8', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('60');
  });

  it('returns 502 when upstream catalog fails or returns malformed payload', async () => {
    vi.mocked(validateProductVisibility).mockResolvedValueOnce({
      status: 'server_error',
      statusCode: 502,
    });

    const req = createRequest('/products/8', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(502);
  });

  it('returns 504 on gateway timeout', async () => {
    vi.mocked(validateProductVisibility).mockResolvedValueOnce({
      status: 'timeout',
    });

    const req = createRequest('/products/8', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(504);
  });

  it('returns 503 on network failure', async () => {
    vi.mocked(validateProductVisibility).mockResolvedValueOnce({
      status: 'network_error',
    });

    const req = createRequest('/products/8', 'GET');
    const res = await proxy(req);

    expect(res.status).toBe(503);
  });
});
