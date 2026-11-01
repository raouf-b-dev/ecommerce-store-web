import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutContent } from './checkout-content';

const replace = vi.hoisted(() => vi.fn());
const getSearchParams = vi.hoisted(() =>
  vi.fn<() => URLSearchParams>(() => new URLSearchParams()),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => getSearchParams(),
}));

vi.mock('./checkout-form', () => ({
  CheckoutForm: ({
    onOrderCreated,
  }: {
    onOrderCreated: (orderId: number) => void;
  }) => (
    <button type="button" onClick={() => onOrderCreated(42)}>
      Mock checkout form
    </button>
  ),
}));

vi.mock('./checkout-confirmation', () => ({
  CheckoutConfirmation: ({ orderId }: { orderId: number }) => (
    <h2>Mock confirmation for {orderId}</h2>
  ),
}));

describe('CheckoutContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSearchParams.mockReturnValue(new URLSearchParams());
  });

  it('shows the Checkout heading with the form when there is no orderId', () => {
    render(<CheckoutContent />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Checkout' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mock checkout form' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /mock confirmation/i }),
    ).not.toBeInTheDocument();
  });

  it('hides the Checkout heading when confirmation is active', () => {
    getSearchParams.mockReturnValue(new URLSearchParams('orderId=99'));

    render(<CheckoutContent />);

    expect(
      screen.queryByRole('heading', { level: 1, name: 'Checkout' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Mock confirmation for 99' }),
    ).toBeInTheDocument();
  });
});
