// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { components } from '@/lib/api/generated/schema';

export type CartResponse = components['schemas']['CartResponseDto'];
export type CartItemResponse = components['schemas']['CartItemResponseDto'];
export type AddCartItemDto = components['schemas']['AddCartItemDto'];
export type UpdateCartItemDto = components['schemas']['UpdateCartItemDto'];
