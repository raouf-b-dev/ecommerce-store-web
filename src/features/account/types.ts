// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { components } from '@/lib/api/generated/schema';

export type UserDetailResponseDto =
  components['schemas']['UserDetailResponseDto'];
export type AddressResponseDto = components['schemas']['AddressResponseDto'];
export type AddAddressDto = components['schemas']['AddAddressDto'];
export type UpdateAddressDto = components['schemas']['UpdateAddressDto'];
export type AddressType = AddressResponseDto['type'];
