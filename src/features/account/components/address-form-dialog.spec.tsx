// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressFormDialog } from './address-form-dialog';
import { createMockAddress } from '@/test/fixtures/account.fixture';

describe('AddressFormDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('shows validation errors for required fields on submit', async () => {
    const user = userEvent.setup();

    render(
      <AddressFormDialog
        open
        onOpenChange={mockOnOpenChange}
        mode="add"
        onSubmit={mockOnSubmit}
        isPending={false}
      />,
    );

    await user.clear(screen.getByLabelText(/^street$/i));
    await user.clear(screen.getByLabelText(/^city$/i));
    await user.clear(screen.getByLabelText(/state \/ province/i));
    await user.clear(screen.getByLabelText(/postal code/i));
    await user.clear(screen.getByLabelText(/^country$/i));

    await user.click(screen.getByRole('button', { name: /^add address$/i }));

    await waitFor(() => {
      expect(screen.getByText('Street address is required')).toBeInTheDocument();
    });
    expect(screen.getByText('City is required')).toBeInTheDocument();
    expect(screen.getByText('State or province is required')).toBeInTheDocument();
    expect(screen.getByText('Postal code is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid add form values', async () => {
    const user = userEvent.setup();

    render(
      <AddressFormDialog
        open
        onOpenChange={mockOnOpenChange}
        mode="add"
        onSubmit={mockOnSubmit}
        isPending={false}
      />,
    );

    await user.clear(screen.getByLabelText(/^street$/i));
    await user.type(screen.getByLabelText(/^street$/i), '123 Main Street');
    await user.clear(screen.getByLabelText(/^city$/i));
    await user.type(screen.getByLabelText(/^city$/i), 'New York');
    await user.clear(screen.getByLabelText(/state \/ province/i));
    await user.type(screen.getByLabelText(/state \/ province/i), 'NY');
    await user.clear(screen.getByLabelText(/postal code/i));
    await user.type(screen.getByLabelText(/postal code/i), '10001');

    await user.click(screen.getByRole('button', { name: /^add address$/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        }),
      );
    });
  });

  it('disables cancel while pending so close is blocked', () => {
    render(
      <AddressFormDialog
        open
        onOpenChange={mockOnOpenChange}
        mode="edit"
        initialAddress={createMockAddress()}
        onSubmit={mockOnSubmit}
        isPending
      />,
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
  });
});
