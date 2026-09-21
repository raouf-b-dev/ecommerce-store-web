import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import {
  throwApiErrorFromResponse,
  throwTooManyRequests,
} from '@/lib/api/throw-api-error';

describe('throwApiErrorFromResponse', () => {
  it('preserves a parsed RFC 9110 error', async () => {
    const response = new Response(
      JSON.stringify({
        statusCode: 400,
        message: 'Validation failed',
        errors: ['email must be valid'],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
    await expect(
      throwApiErrorFromResponse(response, 'Fallback'),
    ).rejects.toEqual(
      new ApiRequestError({
        statusCode: 400,
        message: 'Validation failed',
        errors: ['email must be valid'],
      }),
    );
  });

  it('uses the fallback when no response is available', async () => {
    await expect(
      throwApiErrorFromResponse(undefined, 'Network request failed'),
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'Network request failed',
    });
  });

  it('prefers openapi-fetch error body when Response body is consumed', async () => {
    const response = new Response(null, { status: 422 });
    await expect(
      throwApiErrorFromResponse(
        response,
        'Failed to update cart item quantity.',
        {
          statusCode: 422,
          message: 'Insufficient stock for product. Available: 79',
        },
      ),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: 'Insufficient stock for product. Available: 79',
    });
  });

  it('fills statusCode from response when error body has message only', async () => {
    const response = new Response(null, { status: 422 });
    await expect(
      throwApiErrorFromResponse(response, 'Fallback', {
        message: 'Insufficient stock',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: 'Insufficient stock',
    });
  });
});

describe('throwTooManyRequests', () => {
  it('uses stable copy rather than the API message', async () => {
    const response = new Response(
      JSON.stringify({ statusCode: 429, message: 'raw throttle text' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
    await expect(throwTooManyRequests(response)).rejects.toMatchObject({
      statusCode: 429,
      message: 'Too many requests. Wait a moment and try again.',
    });
  });
});
