// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAddressDialog } from './delete-address-dialog';
import { createMockAddress } from '@/test/fixtures/account.fixture';

describe('DeleteAddressDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConfirm.mockResolvedValue(undefined);
  });

  it('calls onConfirm when delete is clicked', async () => {
    const user = userEvent.setup();
    const address = createMockAddress();

    render(
      <DeleteAddressDialog
        open
        onOpenChange={mockOnOpenChange}
        address={address}
        onConfirm={mockOnConfirm}
        isPending={false}
      />,
    );

    expect(screen.getByText('Delete address?')).toBeInTheDocument();
    expect(screen.getByText(/123 Main Street/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete address$/i }));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <DeleteAddressDialog
        open
        onOpenChange={mockOnOpenChange}
        address={createMockAddress()}
        onConfirm={mockOnConfirm}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
