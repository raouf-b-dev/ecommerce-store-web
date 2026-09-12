import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartContent } from './cart-content';

const mockUseCart = vi.fn();

vi.mock('@/features/cart/hooks/use-cart', () => ({
  useCart: () => mockUseCart(),
}));

vi.mock('@/features/cart/hooks/use-cart-mutations', () => ({
  useUpdateCartItemQuantity: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveCartItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useClearCart: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('CartContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when cart has no items', () => {
    mockUseCart.mockReturnValue({
      cart: null,
      items: [],
      itemCount: 0,
      subtotal: 0,
      totalAmount: 0,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CartContent />);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /explore products/i }),
    ).toBeInTheDocument();
  });

  it('renders cart items and summary when cart has items', () => {
    mockUseCart.mockReturnValue({
      cart: {
        id: 1,
        totalAmount: 120,
        itemCount: 1,
        currency: 'USD',
        createdAt: '2026-09-11T00:00:00Z',
        updatedAt: '2026-09-11T00:00:00Z',
        items: [
          {
            id: 10,
            productId: 101,
            productName: 'Wireless Headphones',
            price: 120,
            currency: 'USD',
            quantity: 1,
            subtotal: 120,
            imageUrl: null,
          },
        ],
      },
      items: [
        {
          id: 10,
          productId: 101,
          productName: 'Wireless Headphones',
          price: 120,
          currency: 'USD',
          quantity: 1,
          subtotal: 120,
          imageUrl: null,
        },
      ],
      itemCount: 1,
      subtotal: 120,
      totalAmount: 120,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CartContent />);

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
  });
});
