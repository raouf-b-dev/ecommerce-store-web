import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutForm } from './checkout-form';
import * as cartHooks from '@/features/cart/hooks/use-cart';
import * as checkoutMutationHook from '@/features/checkout/hooks/use-checkout-mutation';
import * as userProfileHook from '@/features/account/hooks/use-user-profile';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import {
  createMockCart,
  createMockCartItem,
  createMockUseCartResult,
} from '@/test/fixtures/cart.fixture';
import { createMockUseCheckoutMutationResult } from '@/test/fixtures/checkout.fixture';
import {
  createMockAddress,
  createMockUseUserProfileResult,
  createMockUserDetail,
} from '@/test/fixtures/account.fixture';

vi.mock('@/features/cart/hooks/use-cart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/features/checkout/hooks/use-checkout-mutation', () => ({
  useCheckoutMutation: vi.fn(),
}));

vi.mock('@/features/account/hooks/use-user-profile', () => ({
  useUserProfile: vi.fn(),
}));

function mockCartWithItems() {
  const mockCart = createMockCart({
    id: 1,
    currency: 'USD',
    totalAmount: 150,
    itemCount: 1,
    items: [
      createMockCartItem({
        id: 10,
        productId: 100,
        productName: 'Mechanical Keyboard',
        price: 150,
        currency: 'USD',
        quantity: 1,
        subtotal: 150,
      }),
    ],
  });

  vi.mocked(cartHooks.useCart).mockReturnValue(
    createMockUseCartResult({
      cart: mockCart,
      cartId: 1,
      itemCount: 1,
      totalAmount: 150,
      subtotal: 150,
      items: mockCart.items,
    }),
  );

  return mockCart;
}

describe('CheckoutForm', () => {
  const mockOnOrderCreated = vi.fn();
  const mockSubmitCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(userProfileHook.useUserProfile).mockReturnValue(
      createMockUseUserProfileResult({
        user: createMockUserDetail({
          addresses: [createMockAddress({ isDefault: true })],
        }),
      }),
    );

    vi.mocked(checkoutMutationHook.useCheckoutMutation).mockReturnValue(
      createMockUseCheckoutMutationResult({
        mutateAsync: mockSubmitCheckout,
      }),
    );
  });

  it('renders empty cart state when cart item count is 0', () => {
    vi.mocked(cartHooks.useCart).mockReturnValue(
      createMockUseCartResult({
        cart: null,
        cartId: null,
        itemCount: 0,
        totalAmount: 0,
        subtotal: 0,
        items: [],
      }),
    );

    render(<CheckoutForm onOrderCreated={mockOnOrderCreated} />);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /explore products/i }),
    ).toBeInTheDocument();
  });

  it('renders form with saved address selected by default when cart has items', () => {
    mockCartWithItems();

    render(<CheckoutForm onOrderCreated={mockOnOrderCreated} />);

    expect(screen.getByText('Shipping Address')).toBeInTheDocument();
    expect(screen.getByText('Use saved address on file')).toBeInTheDocument();
    expect(screen.getByText('Mock Stripe Payment')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /place order/i }),
    ).toBeInTheDocument();
  });

  it('shows address preview text when profile has a default address', () => {
    mockCartWithItems();

    render(<CheckoutForm onOrderCreated={mockOnOrderCreated} />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
    expect(screen.getByLabelText(/use saved address on file/i)).toBeEnabled();
    expect(screen.getByLabelText(/use saved address on file/i)).toBeChecked();
  });

  it('disables saved radio and selects custom when profile has no default', async () => {
    mockCartWithItems();
    vi.mocked(userProfileHook.useUserProfile).mockReturnValue(
      createMockUseUserProfileResult({
        user: createMockUserDetail({
          addresses: [createMockAddress({ isDefault: false })],
        }),
      }),
    );

    render(<CheckoutForm onOrderCreated={mockOnOrderCreated} />);

    const savedRadio = screen.getByLabelText(/use saved address on file/i);
    const customRadio = screen.getByLabelText(/ship to a custom address/i);

    expect(savedRadio).toBeDisabled();

    await waitFor(() => {
      expect(customRadio).toBeChecked();
    });
  });

  it('submits checkout when default address is used', async () => {
    const user = userEvent.setup();
    mockSubmitCheckout.mockResolvedValue({ orderId: 42, jobId: 'job-42' });
    mockCartWithItems();

    render(<CheckoutForm onOrderCreated={mockOnOrderCreated} />);

    const submitBtn = screen.getByRole('button', { name: /place order/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmitCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          useDefaultAddress: true,
          paymentMethod: 'STRIPE',
        }),
      );
    });
  });

  it('surfaces 409 conflict error message', async () => {
    const user = userEvent.setup();
    mockSubmitCheckout.mockRejectedValue(
      new ApiRequestError({
        statusCode: 409,
        message: 'Conflict',
      }),
    );
    mockCartWithItems();

    render(<CheckoutForm onOrderCreated={mockOnOrderCreated} />);

    const submitBtn = screen.getByRole('button', { name: /place order/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/transaction is currently in progress/i),
      ).toBeInTheDocument();
    });
  });

  it('maps API 400 validation error to specific form field', async () => {
    const user = userEvent.setup();
    mockSubmitCheckout.mockRejectedValue(
      new ApiRequestError({
        statusCode: 400,
        message: 'Validation failed',
        errors: ['customerNotes must be shorter than or equal to 500 characters'],
      }),
    );
    mockCartWithItems();

    render(<CheckoutForm onOrderCreated={mockOnOrderCreated} />);

    const submitBtn = screen.getByRole('button', { name: /place order/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/customerNotes must be shorter than or equal to 500 characters/i),
      ).toBeInTheDocument();
    });
  });
});
