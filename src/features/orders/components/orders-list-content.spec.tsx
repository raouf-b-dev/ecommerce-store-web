import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrdersListContent } from './orders-list-content';
import {
  createMockOrderListItem,
  createMockPaginatedOrders,
  createMockUseOrdersListResult,
} from '@/test/fixtures/orders.fixture';

const mockUseOrdersList = vi.fn();

vi.mock('@/features/orders/hooks/use-orders-list', () => ({
  useOrdersList: (...args: unknown[]) => mockUseOrdersList(...args),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/orders',
}));

vi.mock('next/form', () => ({
  default: ({
    children,
    action,
    ...props
  }: {
    children: React.ReactNode;
    action?: string;
  } & React.FormHTMLAttributes<HTMLFormElement>) => (
    <form action={action} {...props}>
      {children}
    </form>
  ),
}));

describe('OrdersListContent', () => {
  const filters = { page: 1, limit: 10 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when there are no orders', () => {
    mockUseOrdersList.mockReturnValue(
      createMockUseOrdersListResult({
        data: createMockPaginatedOrders({ items: [], total: 0, totalPages: 0 }),
      }),
    );

    render(<OrdersListContent filters={filters} />);

    expect(screen.getByText('No orders yet')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /shop the catalog/i }),
    ).toBeInTheDocument();
  });

  it('renders filtered empty state when filters are active', () => {
    mockUseOrdersList.mockReturnValue(
      createMockUseOrdersListResult({
        data: createMockPaginatedOrders({ items: [], total: 0, totalPages: 0 }),
      }),
    );

    render(
      <OrdersListContent filters={{ ...filters, status: 'confirmed' }} />,
    );

    expect(
      screen.getByText('No orders match these filters'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /clear filters/i }),
    ).toBeInTheDocument();
  });

  it('renders error alert when the list query fails', () => {
    mockUseOrdersList.mockReturnValue(
      createMockUseOrdersListResult({
        data: undefined,
        isError: true,
        error: new Error('Network down'),
      }),
    );

    render(<OrdersListContent filters={filters} />);

    expect(screen.getByText('Could not load orders')).toBeInTheDocument();
    expect(screen.getByText('Network down')).toBeInTheDocument();
  });

  it('renders order rows when data is present', () => {
    mockUseOrdersList.mockReturnValue(
      createMockUseOrdersListResult({
        data: createMockPaginatedOrders({
          items: [
            createMockOrderListItem({
              id: 123,
              orderNumber: 'ORD-2026-0123',
            }),
          ],
        }),
      }),
    );

    render(<OrdersListContent filters={filters} />);

    expect(screen.getByLabelText('Orders')).toBeInTheDocument();
    expect(screen.getByText('ORD-2026-0123')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /ORD-2026-0123/i }),
    ).toHaveAttribute('href', '/orders/123');
  });
});
