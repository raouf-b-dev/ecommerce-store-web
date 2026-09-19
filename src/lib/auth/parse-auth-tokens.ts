export type AuthTokensPayload = {
  accessToken: string;
  refreshToken?: string;
  mustChangePassword: boolean;
  permissions: string[];
};

function parsePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

export function parseAuthTokensPayload(data: unknown): AuthTokensPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid authentication response');
  }

  const record = data as Record<string, unknown>;
  if (typeof record.accessToken !== 'string') {
    throw new Error('Authentication response missing access token');
  }

  return {
    accessToken: record.accessToken,
    refreshToken:
      typeof record.refreshToken === 'string' ? record.refreshToken : undefined,
    mustChangePassword: record.mustChangePassword === true,
    permissions: parsePermissions(record.permissions),
  };
}
