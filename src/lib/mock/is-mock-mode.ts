// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: MIT

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';
}
