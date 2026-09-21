import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartHeaderBadge } from './cart-header-badge';

const mockUseAuth = vi.fn();
const mockUseCart = vi.fn();

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/features/cart/hooks/use-cart', () => ({
  useCart: () => mockUseCart(),
}));

describe('CartHeaderBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 0 items label and no badge count when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUseCart.mockReturnValue({ lineItemCount: 5 });

    render(<CartHeaderBadge />);

    const link = screen.getByRole('link', { name: /shopping cart, 0 items/i });
    expect(link).toHaveAttribute('href', '/cart');
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('renders badge count from line items when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseCart.mockReturnValue({ lineItemCount: 3 });

    render(<CartHeaderBadge />);

    const link = screen.getByRole('link', { name: /shopping cart, 3 items/i });
    expect(link).toHaveAttribute('href', '/cart');
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('pluralizes aria-label for a single line item', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseCart.mockReturnValue({ lineItemCount: 1 });

    render(<CartHeaderBadge />);

    expect(
      screen.getByRole('link', { name: /shopping cart, 1 item$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders 99+ when line item count exceeds 99', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseCart.mockReturnValue({ lineItemCount: 105 });

    render(<CartHeaderBadge />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});
