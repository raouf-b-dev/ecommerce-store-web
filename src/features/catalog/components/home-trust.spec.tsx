import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeTrust } from './home-trust';

describe('HomeTrust', () => {
  it('renders trust and shipping copy without inventing a free-shipping claim', () => {
    render(<HomeTrust />);

    expect(
      screen.getByRole('heading', { name: 'Shopping with confidence' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Ships from stock' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Secure checkout' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Order history' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /the cart and checkout show the shipping amount for your order/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/free shipping/i)).not.toBeInTheDocument();
  });
});
