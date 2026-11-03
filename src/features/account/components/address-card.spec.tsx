import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddressCard } from './address-card';
import { createMockAddress } from '@/test/fixtures/account.fixture';

describe('AddressCard', () => {
  it('shows a shopper-facing type chip and sr-only title for a default home address', () => {
    const address = createMockAddress({ type: 'HOME', isDefault: true });

    render(
      <AddressCard
        address={address}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
      />,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('HOME')).not.toBeInTheDocument();
    expect(screen.getByText('Default Home address')).toBeInTheDocument();
    expect(
      screen.queryByText(/Default address \(HOME\)/i),
    ).not.toBeInTheDocument();
  });

  it('labels a non-default work address without the default chip', () => {
    const address = createMockAddress({ type: 'WORK', isDefault: false });

    render(
      <AddressCard
        address={address}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
      />,
    );

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Work address')).toBeInTheDocument();
    expect(screen.queryByText('Default')).not.toBeInTheDocument();
  });
});
