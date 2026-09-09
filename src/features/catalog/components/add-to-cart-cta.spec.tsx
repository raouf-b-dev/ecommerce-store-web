import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AddToCartCta } from '@/features/catalog/components/add-to-cart-cta';

describe('AddToCartCta', () => {
  it('renders a disabled add to cart button with preview text', () => {
    render(<AddToCartCta />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-describedby', 'add-to-cart-hint');
    expect(screen.getByText(/ordering will be enabled soon/i)).toBeInTheDocument();
  });
});
