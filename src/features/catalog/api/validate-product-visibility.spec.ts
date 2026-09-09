import { describe, expect, it, vi } from 'vitest';
import { validateProductVisibility } from '@/features/catalog/api/validate-product-visibility';
import { serverClient } from '@/lib/api/server-client';
import { createMockProductDetail } from '@/test/fixtures/catalog.fixture';
import {
  createErrorApiResponse,
  createSuccessApiResponse,
} from '@/test/fixtures/api-response.fixture';

vi.mock('@/lib/api/server-client', () => ({
  serverClient: {
    GET: vi.fn(),
  },
}));

describe('validateProductVisibility', () => {
  const activeProduct = createMockProductDetail({ id: 8, name: '4K Projector', isActive: true });

  it('returns active status for an active product', async () => {
    vi.mocked(serverClient.GET).mockResolvedValueOnce(createSuccessApiResponse(activeProduct));

    const result = await validateProductVisibility(8);
    expect(result).toEqual({ status: 'active', product: activeProduct });
  });

  it('returns not_found status when API returns 404', async () => {
    vi.mocked(serverClient.GET).mockResolvedValueOnce(
      createErrorApiResponse({ message: 'Not found' }, 404),
    );

    const result = await validateProductVisibility(999);
    expect(result).toEqual({ status: 'not_found' });
  });

  it('returns inactive status when product.isActive is false', async () => {
    const inactiveProduct = createMockProductDetail({ id: 10, isActive: false });
    vi.mocked(serverClient.GET).mockResolvedValueOnce(createSuccessApiResponse(inactiveProduct));

    const result = await validateProductVisibility(10);
    expect(result).toEqual({ status: 'inactive' });
  });

  it('returns rate_limited with retryAfter header when API returns 429', async () => {
    vi.mocked(serverClient.GET).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'Too many requests' },
      response: new Response(null, {
        status: 429,
        headers: { 'retry-after': '30' },
      }),
    });

    const result = await validateProductVisibility(8);
    expect(result).toEqual({ status: 'rate_limited', retryAfter: '30' });
  });

  it('returns server_error when API returns 500', async () => {
    vi.mocked(serverClient.GET).mockResolvedValueOnce(
      createErrorApiResponse({ message: 'Internal error' }, 500),
    );

    const result = await validateProductVisibility(8);
    expect(result).toEqual({ status: 'server_error', statusCode: 500 });
  });

  it('returns server_error with 502 for malformed 200 response (id mismatch)', async () => {
    const mismatchedProduct = createMockProductDetail({ id: 99 });
    vi.mocked(serverClient.GET).mockResolvedValueOnce(createSuccessApiResponse(mismatchedProduct));

    const result = await validateProductVisibility(8);
    expect(result).toEqual({ status: 'server_error', statusCode: 502 });
  });

  it('returns server_error with 502 for null 200 body', async () => {
    vi.mocked(serverClient.GET).mockResolvedValueOnce(createSuccessApiResponse(null as never));

    const result = await validateProductVisibility(8);
    expect(result).toEqual({ status: 'server_error', statusCode: 502 });
  });

  it('returns timeout when fetch aborts with TimeoutError', async () => {
    const timeoutError = new Error('The operation was aborted due to timeout');
    timeoutError.name = 'TimeoutError';
    vi.mocked(serverClient.GET).mockRejectedValueOnce(timeoutError);

    const result = await validateProductVisibility(8);
    expect(result).toEqual({ status: 'timeout' });
  });

  it('returns network_error when fetch throws TypeError', async () => {
    vi.mocked(serverClient.GET).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await validateProductVisibility(8);
    expect(result).toEqual({ status: 'network_error' });
  });

  it('returns server_error with 500 for unexpected thrown errors', async () => {
    vi.mocked(serverClient.GET).mockRejectedValueOnce(new Error('Unexpected disk failure'));

    const result = await validateProductVisibility(8);
    expect(result).toEqual({ status: 'server_error', statusCode: 500 });
  });
});
