import {
  getErrorMessage,
  hasHttpStatus,
} from '@/lib/api/parse-api-error';

/**
 * Map cancel PATCH failures by HTTP status (and parse-api-error), not English text.
 * OpenAPI: 401, 403, 409 (not cancellable), 422 (missing or inaccessible).
 */
export function getCancelOrderErrorMessage(error: unknown): string {
  if (hasHttpStatus(error, 401)) {
    return 'Your session has expired. Sign in again to cancel this order.';
  }
  if (hasHttpStatus(error, 403)) {
    return 'You do not have permission to cancel this order.';
  }
  if (hasHttpStatus(error, 409)) {
    return 'This order can no longer be cancelled.';
  }
  if (hasHttpStatus(error, 422)) {
    return 'This order could not be found.';
  }
  return getErrorMessage(
    error,
    'Could not cancel this order. Please try again.',
  );
}
