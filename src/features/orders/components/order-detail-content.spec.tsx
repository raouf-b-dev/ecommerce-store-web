import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderDetailContent } from './order-detail-content';
import {
  createMockOrderDetail,
  createMockPaymentDetail,
  createMockUseOrderDetailResult,
  createMockUseOrderPaymentResult,
} from '@/test/fixtures/orders.fixture';

const mockUseOrderDetail = vi.fn();
const mockUseOrderPayment = vi.fn();

vi.mock('@/features/orders/hooks/use-order-detail', () => ({
  useOrderDetail: (...args: unknown[]) => mockUseOrderDetail(...args),
}));

vi.mock('@/features/orders/hooks/use-order-payment', () => ({
  useOrderPayment: (...args: unknown[]) => mockUseOrderPayment(...args),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/orders/123',
}));

describe('OrderDetailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrderPayment.mockReturnValue(
      createMockUseOrderPaymentResult({
        payment: createMockPaymentDetail(),
      }),
    );
  });

  it('shows loading state while the order is loading', () => {
    mockUseOrderDetail.mockReturnValue(
      createMockUseOrderDetailResult({
        order: undefined,
        isLoading: true,
      }),
    );

    render(<OrderDetailContent orderId={123} />);

    expect(screen.getByText('Loading order details…')).toBeInTheDocument();
  });

  it('shows error state when the order fails to load', () => {
    mockUseOrderDetail.mockReturnValue(
      createMockUseOrderDetailResult({
        order: undefined,
        isError: true,
        error: new Error('Order missing'),
      }),
    );

    render(<OrderDetailContent orderId={123} />);

    expect(screen.getByText('Could not load order')).toBeInTheDocument();
    expect(screen.getByText('Order missing')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to orders/i }),
    ).toBeInTheDocument();
  });

  it('renders order details on success', () => {
    mockUseOrderDetail.mockReturnValue(
      createMockUseOrderDetailResult({
        order: createMockOrderDetail({
          orderNumber: 'ORD-2026-0123',
          shippingAddress: 'Alice Smith, 456 Oak Avenue, San Francisco, CA 94102, US',
        }),
      }),
    );

    render(<OrderDetailContent orderId={123} />);

    expect(screen.getByText('ORD-2026-0123')).toBeInTheDocument();
    expect(screen.getByText(/456 Oak Avenue/)).toBeInTheDocument();
    expect(screen.getByText('Ergonomic Desk Chair')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });
});
