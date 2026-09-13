export const checkoutKeys = {
  all: ['checkout'] as const,
  details: () => [...checkoutKeys.all, 'detail'] as const,
  detail: (id: number | null | undefined) =>
    [...checkoutKeys.details(), id] as const,
};
