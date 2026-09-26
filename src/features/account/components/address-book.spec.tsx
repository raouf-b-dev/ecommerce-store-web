// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddressBook } from './address-book';
import {
  createMockAddress,
  createMockUseAddressMutationsResult,
  createMockUseUserProfileResult,
  createMockUserDetail,
} from '@/test/fixtures/account.fixture';

const mockUseUserProfile = vi.fn();
const mockUseAddressMutations = vi.fn();

vi.mock('@/features/account/hooks/use-user-profile', () => ({
  useUserProfile: (...args: unknown[]) => mockUseUserProfile(...args),
}));

vi.mock('@/features/account/hooks/use-address-mutations', () => ({
  useAddressMutations: (...args: unknown[]) => mockUseAddressMutations(...args),
}));

describe('AddressBook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAddressMutations.mockReturnValue(
      createMockUseAddressMutationsResult(),
    );
  });

  it('renders empty state when the user has no addresses', () => {
    mockUseUserProfile.mockReturnValue(
      createMockUseUserProfileResult({
        user: createMockUserDetail({ addresses: [], addressCount: 0 }),
      }),
    );

    render(<AddressBook userId={1} />);

    expect(
      screen.getByText(/no addresses yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /add address/i }).length,
    ).toBeGreaterThan(0);
  });

  it('renders address cards including a default badge', () => {
    mockUseUserProfile.mockReturnValue(
      createMockUseUserProfileResult({
        user: createMockUserDetail({
          addresses: [
            createMockAddress({
              id: 1,
              isDefault: true,
              street: '123 Main Street',
              street2: undefined,
            }),
            createMockAddress({
              id: 2,
              isDefault: false,
              street: '456 Oak Avenue',
              street2: undefined,
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94102',
            }),
          ],
          addressCount: 2,
        }),
      }),
    );

    render(<AddressBook userId={1} />);

    expect(screen.getByLabelText('Saved addresses')).toBeInTheDocument();
    expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /set as default/i }),
    ).toBeInTheDocument();
  });
});
