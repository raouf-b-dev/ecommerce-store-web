// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: MIT

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
