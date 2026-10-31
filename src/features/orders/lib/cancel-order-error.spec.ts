import { describe, expect, it } from 'vitest';
import { getCancelOrderErrorMessage } from '@/features/orders/lib/cancel-order-error';
import { ApiRequestError } from '@/lib/api/parse-api-error';

describe('getCancelOrderErrorMessage', () => {
  it.each([
    [401, 'Your session has expired. Sign in again to cancel this order.'],
    [403, 'You do not have permission to cancel this order.'],
    [409, 'This order can no longer be cancelled.'],
    [422, 'This order could not be found.'],
  ] as const)('maps HTTP %i to a stable shopper message', (status, message) => {
    expect(
      getCancelOrderErrorMessage(
        new ApiRequestError({
          statusCode: status,
          message: 'raw API text must not drive control flow',
          code: 'DOMAIN_ERROR',
        }),
      ),
    ).toBe(message);
  });

  it('falls back to getErrorMessage for other failures', () => {
    expect(
      getCancelOrderErrorMessage(
        new ApiRequestError({
          statusCode: 500,
          message: 'Upstream failure',
        }),
      ),
    ).toBe('Upstream failure');
  });

  it('uses the generic fallback when the error has no message', () => {
    expect(getCancelOrderErrorMessage({})).toBe(
      'Could not cancel this order. Please try again.',
    );
  });
});
