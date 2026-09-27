export const cartKeys = {
  all: ['cart'] as const,
  current: (userId?: string | null) =>
    userId != null && userId !== ''
      ? ([...cartKeys.all, 'current', userId] as const)
      : ([...cartKeys.all, 'current'] as const),
  details: () => [...cartKeys.all, 'detail'] as const,
  detail: (id: number | null | undefined) => [...cartKeys.details(), id] as const,
};
