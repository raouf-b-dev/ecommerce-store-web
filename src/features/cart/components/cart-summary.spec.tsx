// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartSummary } from './cart-summary';

const mockMutateClear = vi.fn();

vi.mock('@/features/cart/hooks/use-cart-mutations', () => ({
  useClearCart: () => ({
    mutateAsync: mockMutateClear,
    isPending: false,
  }),
}));

describe('CartSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary values correctly', () => {
    render(
      <CartSummary
        subtotal={250}
        totalAmount={250}
        currency="USD"
        itemCount={3}
      />,
    );

    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Subtotal (3 units)')).toBeInTheDocument();
    expect(screen.getAllByText('$250.00')).toHaveLength(2); // subtotal & total
  });

  it('triggers clear cart mutation when clicked', async () => {
    mockMutateClear.mockResolvedValueOnce(undefined);

    render(
      <CartSummary
        subtotal={100}
        totalAmount={100}
        currency="USD"
        itemCount={1}
      />,
    );

    const clearButton = screen.getByRole('button', {
      name: /clear shopping cart/i,
    });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockMutateClear).toHaveBeenCalled();
    });
  });

  it('renders a link to /checkout', () => {
    render(
      <CartSummary
        subtotal={100}
        totalAmount={100}
        currency="USD"
        itemCount={1}
      />,
    );

    const checkoutLink = screen.getByRole('link', {
      name: /proceed to checkout/i,
    });
    expect(checkoutLink).toBeInTheDocument();
    expect(checkoutLink).toHaveAttribute('href', '/checkout');
  });
});
