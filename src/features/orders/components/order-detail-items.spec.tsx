import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderDetailItems } from './order-detail-items';
import { createMockOrderItemDetail } from '@/test/fixtures/orders.fixture';

describe('OrderDetailItems', () => {
  it('labels Qty x price and Subtotal for a line item', () => {
    render(
      <OrderDetailItems
        currency="USD"
        items={[createMockOrderItemDetail()]}
      />,
    );

    expect(screen.getByText('Qty × price:')).toBeInTheDocument();
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Ergonomic Desk Chair')).toBeInTheDocument();
  });

  it('shows empty copy when there are no line items', () => {
    render(<OrderDetailItems currency="USD" items={[]} />);

    expect(
      screen.getByText('This order has no line items.'),
    ).toBeInTheDocument();
  });
});
