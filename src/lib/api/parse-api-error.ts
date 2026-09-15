export type ParsedApiError = {
  statusCode: number;
  message: string;
  code?: string;
  errors?: string[];
  retryAfterSeconds?: number;
};

export class ApiRequestError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly errors?: string[];
  readonly retryAfterSeconds?: number;

  constructor(parsed: ParsedApiError) {
    super(parsed.message);
    this.name = 'ApiRequestError';
    this.statusCode = parsed.statusCode;
    this.code = parsed.code;
    this.errors = parsed.errors;
    this.retryAfterSeconds = parsed.retryAfterSeconds;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseApiErrorBody(body: unknown): ParsedApiError | null {
  if (!isRecord(body)) {
    return null;
  }

  const statusCode =
    typeof body.statusCode === 'number' ? body.statusCode : null;
  const message = typeof body.message === 'string' ? body.message : null;

  if (statusCode === null || message === null) {
    return null;
  }

  const errors = Array.isArray(body.errors)
    ? body.errors.filter((item): item is string => typeof item === 'string')
    : undefined;

  return {
    statusCode,
    message,
    code: typeof body.code === 'string' ? body.code : undefined,
    errors: errors && errors.length > 0 ? errors : undefined,
  };
}

export async function readApiErrorFromResponse(
  response: Response,
): Promise<ParsedApiError | null> {
  try {
    const body: unknown = await response.clone().json();
    return parseApiErrorBody(body);
  } catch {
    return null;
  }
}

export function toApiRequestError(
  response: Response,
  parsed: ParsedApiError | null,
  fallbackMessage: string,
): ApiRequestError {
  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfterSeconds = parseRetryAfterSeconds(retryAfterHeader);

  return new ApiRequestError({
    statusCode: parsed?.statusCode ?? response.status,
    message: parsed?.message ?? fallbackMessage,
    code: parsed?.code,
    errors: parsed?.errors,
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  });
}

export function parseRetryAfterSeconds(
  value: string | null | undefined,
): number | undefined {
  if (!value) {
    return undefined;
  }
  const asInt = Number.parseInt(value, 10);
  if (Number.isFinite(asInt) && asInt >= 0) {
    return asInt;
  }
  const asDate = Date.parse(value);
  if (Number.isFinite(asDate)) {
    return Math.max(0, Math.ceil((asDate - Date.now()) / 1000));
  }
  return undefined;
}

export function isOptimisticLockConflict(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.code === 'OPTIMISTIC_LOCK_CONFLICT'
  );
}

export function getErrorStatusCode(error: unknown): number | null {
  if (error instanceof ApiRequestError) {
    return error.statusCode;
  }
  if (!isRecord(error)) {
    return null;
  }
  if (typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  if (typeof error.status === 'number') {
    return error.status;
  }
  return null;
}

export function isStatusInRange(
  error: unknown,
  min: number,
  max: number,
): boolean {
  const status = getErrorStatusCode(error);
  return status !== null && status >= min && status <= max;
}

export function hasHttpStatus(
  error: unknown,
  ...statusCodes: number[]
): boolean {
  const status = getErrorStatusCode(error);
  return status !== null && statusCodes.includes(status);
}

export const isClientError = (error: unknown): boolean =>
  isStatusInRange(error, 400, 499);

export const isServerError = (error: unknown): boolean =>
  isStatusInRange(error, 500, 599);

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    if (error.errors && error.errors.length > 0) {
      return error.errors.join('. ');
    }
    if (error.message?.trim()) return error.message;
  }
  if (error instanceof Error && error.message?.trim()) {
    return error.message;
  }
  return fallback;
}
