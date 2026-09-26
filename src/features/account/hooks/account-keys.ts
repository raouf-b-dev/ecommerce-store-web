// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

export const accountKeys = {
  all: ['account'] as const,
  me: () => [...accountKeys.all, 'me'] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (userId: number | null | undefined) =>
    [...accountKeys.details(), userId] as const,
};
