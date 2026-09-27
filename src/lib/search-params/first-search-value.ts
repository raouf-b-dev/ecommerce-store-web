// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: MIT

export function firstSearchValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
