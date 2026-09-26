// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

export const cartKeys = {
  all: ['cart'] as const,
  current: (userId?: string | null) =>
    userId != null && userId !== ''
      ? ([...cartKeys.all, 'current', userId] as const)
      : ([...cartKeys.all, 'current'] as const),
  details: () => [...cartKeys.all, 'detail'] as const,
  detail: (id: number | null | undefined) => [...cartKeys.details(), id] as const,
};
