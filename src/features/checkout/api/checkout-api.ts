import { browserClient } from '@/lib/api/browser-client';
import {
  ApiRequestError,
  readApiErrorFromResponse,
  toApiRequestError,
} from '@/lib/api/parse-api-error';
import { throwApiErrorFromResponse } from '@/lib/api/throw-api-error';
import type {
  CheckoutDto,
  CheckoutResponseDto,
} from '@/features/checkout/types';

const DEFAULT_CHECKOUT_RETRY_AFTER_SECONDS = 2;

export async function checkoutRequest(
  dto: CheckoutDto,
  idempotencyKey: string,
): Promise<CheckoutResponseDto> {
  const { data, error, response } = await browserClient.POST(
    '/v1/orders/checkout',
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: dto,
    },
  );

  if (response.status === 409) {
    const parsed = await readApiErrorFromResponse(response);
    const err = toApiRequestError(
      response,
      parsed,
      'Checkout already in progress. Retry shortly.',
    );
    throw new ApiRequestError({
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      errors: err.errors,
      retryAfterSeconds:
        err.retryAfterSeconds ?? DEFAULT_CHECKOUT_RETRY_AFTER_SECONDS,
    });
  }

  if (error || !data || !response.ok) {
    return await throwApiErrorFromResponse(response, 'Checkout request failed.');
  }

  return data;
}
