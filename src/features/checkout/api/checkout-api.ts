import { browserClient } from '@/lib/api/browser-client';
import { throwApiErrorFromResponse } from '@/lib/api/throw-api-error';
import type {
  CheckoutDto,
  CheckoutResponseDto,
} from '@/features/checkout/types';

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

  if (error || !data || !response.ok) {
    return await throwApiErrorFromResponse(response, 'Checkout request failed.');
  }

  return data;
}
