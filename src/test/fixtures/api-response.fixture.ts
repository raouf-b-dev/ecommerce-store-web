// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Clean typed fixtures for openapi-fetch API responses in unit tests.
 */
export interface MockApiResponse<T, E = undefined> {
  data: T | undefined;
  error: E | undefined;
  response: Response;
}

export function createSuccessApiResponse<T>(
  data: T,
  status = 200,
): MockApiResponse<T, undefined> {
  return {
    data,
    error: undefined,
    response: new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  };
}

export function createErrorApiResponse<E>(
  error: E,
  status: number,
): MockApiResponse<undefined, E> {
  return {
    data: undefined,
    error,
    response: new Response(JSON.stringify(error), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  };
}
