export const cartKeys = {
  all: ['cart'] as const,
  current: () => [...cartKeys.all, 'current'] as const,
  details: () => [...cartKeys.all, 'detail'] as const,
  detail: (id: number | null | undefined) => [...cartKeys.details(), id] as const,
};
