import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartItemRow } from './cart-item-row';
import type { CartItemResponse } from '@/features/cart/types';

const mockMutateUpdate = vi.fn();
const mockMutateRemove = vi.fn();

vi.mock('@/features/cart/hooks/use-cart-mutations', () => ({
  useUpdateCartItemQuantity: () => ({
    mutateAsync: mockMutateUpdate,
    isPending: false,
  }),
  useRemoveCartItem: () => ({
    mutateAsync: mockMutateRemove,
    isPending: false,
  }),
}));

const mockItem: CartItemResponse = {
  id: 1,
  productId: 10,
  productName: 'Ergonomic Desk',
  price: 150,
  currency: 'USD',
  quantity: 2,
  subtotal: 300,
  imageUrl: 'http://localhost:3000/desk.jpg',
};

describe('CartItemRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders item details correctly', () => {
    render(<CartItemRow item={mockItem} />);

    expect(screen.getByText('Ergonomic Desk')).toBeInTheDocument();
    expect(screen.getByText('$150.00 each')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
  });

  it('updates quantity when increment button clicked', async () => {
    mockMutateUpdate.mockResolvedValueOnce(undefined);
    render(<CartItemRow item={mockItem} />);

    const increment = screen.getByRole('button', {
      name: /increase quantity of ergonomic desk/i,
    });
    fireEvent.click(increment);

    await waitFor(() => {
      expect(mockMutateUpdate).toHaveBeenCalledWith({
        itemId: 1,
        quantity: 3,
      });
    });
  });

  it('removes item when remove button clicked', async () => {
    mockMutateRemove.mockResolvedValueOnce(undefined);
    render(<CartItemRow item={mockItem} />);

    const removeButton = screen.getByRole('button', {
      name: /remove ergonomic desk from cart/i,
    });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockMutateRemove).toHaveBeenCalledWith({
        itemId: 1,
      });
    });
  });
});
