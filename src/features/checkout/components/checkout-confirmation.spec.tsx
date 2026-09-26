// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckoutConfirmation } from './checkout-confirmation';
import * as pollingHook from '@/features/checkout/hooks/use-order-polling';
import { createMockUseOrderPollingResult } from '@/test/fixtures/checkout.fixture';
import { createMockOrderDetail } from '@/test/fixtures/orders.fixture';

vi.mock('@/features/checkout/hooks/use-order-polling', () => ({
  useOrderPolling: vi.fn(),
}));

describe('CheckoutConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending state while status is pending_payment', () => {
    vi.mocked(pollingHook.useOrderPolling).mockReturnValue(
      createMockUseOrderPollingResult({
        order: createMockOrderDetail({ status: 'pending_payment' }),
      }),
    );

    render(<CheckoutConfirmation orderId={123} />);

    expect(screen.getByText('Finalizing Your Order')).toBeInTheDocument();
    expect(screen.getByText('ORD-2026-0123')).toBeInTheDocument();
    expect(screen.getByText('Pending Payment')).toBeInTheDocument();
  });

  it('renders timeout notice with manual check button when timed out', () => {
    const mockRefetch = vi.fn();
    vi.mocked(pollingHook.useOrderPolling).mockReturnValue(
      createMockUseOrderPollingResult({
        order: createMockOrderDetail({ status: 'pending_payment' }),
        isTimedOut: true,
        handleManualRefetch: mockRefetch,
      }),
    );

    render(<CheckoutConfirmation orderId={123} />);

    expect(
      screen.getByText(/confirmation is taking longer than usual/i),
    ).toBeInTheDocument();

    const checkBtn = screen.getByRole('button', { name: /check status now/i });
    fireEvent.click(checkBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders terminal failure view when payment fails', () => {
    vi.mocked(pollingHook.useOrderPolling).mockReturnValue(
      createMockUseOrderPollingResult({
        order: createMockOrderDetail({ status: 'payment_failed' }),
      }),
    );

    render(<CheckoutConfirmation orderId={123} />);

    expect(
      screen.getByText('Payment Could Not Be Completed'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to cart/i })).toBeInTheDocument();
  });

  it('renders confirmed state with items and address summary when order succeeds', () => {
    vi.mocked(pollingHook.useOrderPolling).mockReturnValue(
      createMockUseOrderPollingResult({
        order: createMockOrderDetail({ status: 'confirmed' }),
      }),
    );

    render(<CheckoutConfirmation orderId={123} />);

    expect(screen.getByText('Thank You For Your Order!')).toBeInTheDocument();
    expect(screen.getByText('Ergonomic Desk Chair')).toBeInTheDocument();
    expect(screen.getByText(/456 Oak Avenue/)).toBeInTheDocument();
    expect(
      screen.getByText(/is confirmed\. Check your account for status updates/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/included in total/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view order details/i }),
    ).toHaveAttribute('href', '/orders/123');
    expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
  });
});
