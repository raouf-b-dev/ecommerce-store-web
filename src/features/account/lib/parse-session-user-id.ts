/**
 * Parse AuthSession.userId (JWT `sub` string) to a positive integer path param.
 * Returns undefined when missing or invalid — fail closed before calling the API.
 */
export function parseSessionUserId(
  userId: string | null | undefined,
): number | undefined {
  if (userId == null || userId.trim() === '') {
    return undefined;
  }

  const parsed = Number(userId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}
