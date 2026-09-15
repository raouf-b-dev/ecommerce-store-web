const AUTH_LOOP_PREFIXES = ['/login', '/register', '/change-password'] as const;

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || typeof value !== 'string' || !value.startsWith('/')) {
    return '/';
  }

  if (value.startsWith('//') || value.startsWith('/\\')) {
    return '/';
  }

  try {
    const parsed = new URL(value, 'http://dummy.local');
    if (parsed.origin !== 'http://dummy.local') {
      return '/';
    }

    const blocked = AUTH_LOOP_PREFIXES.some(
      (prefix) =>
        parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`),
    );
    if (blocked) {
      return '/';
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
}
