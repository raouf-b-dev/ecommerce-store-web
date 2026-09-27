import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge, type OrderStatus } from './status-badge';

describe('StatusBadge', () => {
  const statuses: { status: OrderStatus; label: string }[] = [
    { status: 'pending_payment', label: 'Pending Payment' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'processing', label: 'Processing' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' },
    { status: 'payment_failed', label: 'Payment Failed' },
    { status: 'cancelled', label: 'Cancelled' },
    { status: 'refunded', label: 'Refunded' },
  ];

  it.each(statuses)('renders correct label and attribute for status: %s', ({ status, label }) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(label);
    expect(badge).toHaveAttribute('data-status', status);
  });

  it('hides dot indicator when showDot is false', () => {
    const { container } = render(<StatusBadge status="confirmed" showDot={false} />);
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeNull();
  });
});
