import {
  ApiRequestError,
  getErrorMessage,
  hasHttpStatus,
} from '@/lib/api/parse-api-error';

/**
 * Map cancel PATCH failures by HTTP status and/or API `code`, not English text.
 * OpenAPI: 401, 403, 409 (not cancellable), 404 + ORDER_NOT_FOUND (missing or inaccessible).
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
  if (
    hasHttpStatus(error, 404) ||
    (error instanceof ApiRequestError && error.code === 'ORDER_NOT_FOUND')
  ) {
    return 'This order could not be found.';
  }
  return getErrorMessage(
    error,
    'Could not cancel this order. Please try again.',
  );
}
