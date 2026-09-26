// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddToCartCta } from './add-to-cart-cta';
import { toast } from 'sonner';

const mockUseAuth = vi.fn();
const mockPush = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/products/123',
}));

vi.mock('@/features/cart/hooks/use-cart-mutations', () => ({
  useAddToCart: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AddToCartCta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated',
    });
  });

  it('renders disabled "Out of stock" button when unavailable', () => {
    render(
      <AddToCartCta
        productId={1}
        productName="Test Product"
        isAvailable={false}
      />,
    );

    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeDisabled();
  });

  it('renders disabled button when availableQuantity is 0', () => {
    render(
      <AddToCartCta
        productId={1}
        productName="Test Product"
        isAvailable={true}
        availableQuantity={0}
      />,
    );

    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeDisabled();
  });

  it('increments and decrements quantity within bounds', () => {
    render(
      <AddToCartCta
        productId={1}
        productName="Test Product"
        isAvailable={true}
        availableQuantity={3}
      />,
    );

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity/i,
    });
    const decrementButton = screen.getByRole('button', {
      name: /decrease quantity/i,
    });

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(decrementButton).toBeDisabled();

    fireEvent.click(incrementButton);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(decrementButton).not.toBeDisabled();

    fireEvent.click(incrementButton);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(incrementButton).toBeDisabled();

    fireEvent.click(decrementButton);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      status: 'unauthenticated',
    });

    render(
      <AddToCartCta
        productId={1}
        productName="Test Product"
        isAvailable={true}
        availableQuantity={5}
      />,
    );

    const addToCartButton = screen.getByRole('button', {
      name: /add to cart/i,
    });
    fireEvent.click(addToCartButton);

    expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fproducts%2F123');
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls mutateAsync and displays success toast when authenticated', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);

    render(
      <AddToCartCta
        productId={42}
        productName="Super Sneaker"
        isAvailable={true}
        availableQuantity={5}
      />,
    );

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity/i,
    });
    fireEvent.click(incrementButton);

    const addToCartButton = screen.getByRole('button', {
      name: /add to cart/i,
    });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        productId: 42,
        quantity: 2,
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Added 2 × "Super Sneaker" to cart',
    );
  });

  it('shows error alert when mutateAsync fails', async () => {
    mockMutateAsync.mockRejectedValueOnce(
      new Error('Insufficient stock requested'),
    );

    render(
      <AddToCartCta
        productId={42}
        productName="Super Sneaker"
        isAvailable={true}
        availableQuantity={5}
      />,
    );

    const addToCartButton = screen.getByRole('button', {
      name: /add to cart/i,
    });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(
        screen.getByText('Insufficient stock requested'),
      ).toBeInTheDocument();
    });
  });
});
