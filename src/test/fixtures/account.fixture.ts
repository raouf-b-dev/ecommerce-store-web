// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { vi } from 'vitest';
import type {
  AddressResponseDto,
  UserDetailResponseDto,
} from '@/features/account/types';
import type { UseUserProfileResult } from '@/features/account/hooks/use-user-profile';
import type {
  AddressMutationControls,
  UseAddressMutationsResult,
} from '@/features/account/hooks/use-address-mutations';

export function createMockAddress(
  overrides?: Partial<AddressResponseDto>,
): AddressResponseDto {
  return {
    id: 1,
    street: '123 Main Street',
    street2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    type: 'HOME',
    isDefault: true,
    deliveryInstructions: 'Leave at front door',
    createdAt: '2026-09-13T12:00:00.000Z',
    updatedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  };
}

export function createMockUserDetail(
  overrides?: Partial<UserDetailResponseDto>,
): UserDetailResponseDto {
  const addresses = overrides?.addresses ?? [createMockAddress()];

  return {
    id: 1,
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@store.local',
    phone: '+15551234567',
    isActive: true,
    roleCode: 'CUSTOMER',
    createdAt: '2026-01-01T00:00:00.000Z',
    addressCount: overrides?.addressCount ?? addresses.length,
    addresses,
    updatedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  };
}

export function createMockUseUserProfileResult(
  overrides?: Partial<UseUserProfileResult>,
): UseUserProfileResult {
  return {
    user: createMockUserDetail(),
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockAddressMutationControls<TVariables>(): AddressMutationControls<TVariables> {
  return {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  };
}

export function createMockUseAddressMutationsResult(
  overrides?: Partial<UseAddressMutationsResult>,
): UseAddressMutationsResult {
  return {
    addAddress: createMockAddressMutationControls(),
    updateAddress: createMockAddressMutationControls(),
    deleteAddress: createMockAddressMutationControls(),
    setDefaultAddress: createMockAddressMutationControls(),
    ...overrides,
  };
}
