import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutRequest } from './checkout-api';
import type { ApiRequestError } from '@/lib/api/parse-api-error';

const mockClient = vi.hoisted(() => ({
  POST: vi.fn(),
}));

vi.mock('@/lib/api/browser-client', () => ({
  browserClient: mockClient,
}));

describe('checkoutRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts checkout with Idempotency-Key and returns the response DTO', async () => {
    mockClient.POST.mockResolvedValueOnce({
      data: { orderId: 42, jobId: 'job-42' },
      error: undefined,
      response: new Response(JSON.stringify({ orderId: 42, jobId: 'job-42' }), {
        status: 201,
      }),
    });

    const result = await checkoutRequest(
      { cartId: 1, paymentMethod: 'STRIPE' },
      'idem-1',
    );

    expect(mockClient.POST).toHaveBeenCalledWith('/v1/orders/checkout', {
      headers: { 'Idempotency-Key': 'idem-1' },
      body: { cartId: 1, paymentMethod: 'STRIPE' },
    });
    expect(result).toEqual({ orderId: 42, jobId: 'job-42' });
  });

  it('surfaces Retry-After seconds on 409 conflicts', async () => {
    mockClient.POST.mockResolvedValueOnce({
      data: undefined,
      error: { message: 'In progress' },
      response: new Response(null, {
        status: 409,
        headers: { 'Retry-After': '5' },
      }),
    });

    await expect(
      checkoutRequest({ cartId: 1, paymentMethod: 'STRIPE' }, 'idem-2'),
    ).rejects.toMatchObject({
      statusCode: 409,
      retryAfterSeconds: 5,
    } satisfies Partial<ApiRequestError>);
  });

  it('defaults Retry-After to 2 seconds when the header is missing on 409', async () => {
    mockClient.POST.mockResolvedValueOnce({
      data: undefined,
      error: { message: 'In progress' },
      response: new Response(null, { status: 409 }),
    });

    await expect(
      checkoutRequest({ cartId: 1, paymentMethod: 'STRIPE' }, 'idem-3'),
    ).rejects.toMatchObject({
      statusCode: 409,
      retryAfterSeconds: 2,
    });
  });
});
