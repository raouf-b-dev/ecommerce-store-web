import {
  readApiErrorFromResponse,
  toApiRequestError,
} from '@/lib/api/parse-api-error';

const TOO_MANY_REQUESTS_MESSAGE =
  'Too many requests. Wait a moment and try again.';

export async function throwTooManyRequests(response: Response): Promise<never> {
  const parsed = await readApiErrorFromResponse(response);
  throw toApiRequestError(
    response,
    {
      statusCode: 429,
      message: TOO_MANY_REQUESTS_MESSAGE,
      code: parsed?.code,
    },
    TOO_MANY_REQUESTS_MESSAGE,
  );
}

export async function throwApiErrorFromResponse(
  response: Response | undefined,
  fallbackMessage: string,
): Promise<never> {
  if (response?.status === 429) {
    await throwTooManyRequests(response);
  }
  const parsed = response ? await readApiErrorFromResponse(response) : null;
  throw toApiRequestError(
    response ?? new Response(null, { status: 500 }),
    parsed,
    fallbackMessage,
  );
}
