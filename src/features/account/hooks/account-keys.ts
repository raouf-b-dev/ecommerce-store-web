export const accountKeys = {
  all: ['account'] as const,
  me: () => [...accountKeys.all, 'me'] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (userId: number | null | undefined) =>
    [...accountKeys.details(), userId] as const,
};
