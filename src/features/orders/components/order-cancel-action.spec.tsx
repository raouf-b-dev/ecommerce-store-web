import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { useCancelOrder } from '@/features/orders/hooks/use-cancel-order';
import { OrderCancelAction } from '@/features/orders/components/order-cancel-action';
import { ApiRequestError } from '@/lib/api/parse-api-error';

const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

type CancelMutationStub = Pick<
  ReturnType<typeof useCancelOrder>,
  'mutateAsync' | 'isPending' | 'reset'
>;

const cancelMutation = vi.hoisted(() => vi.fn<() => CancelMutationStub>());

vi.mock('@/features/orders/hooks/use-cancel-order', () => ({
  useCancelOrder: () => cancelMutation(),
}));

describe('OrderCancelAction', () => {
  const mutateAsync = vi.fn<CancelMutationStub['mutateAsync']>();
  const reset = vi.fn<CancelMutationStub['reset']>();

  beforeEach(() => {
    vi.clearAllMocks();
    cancelMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
      reset,
    });
  });

  it('cancels the order after confirm and shows success feedback', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({
      id: 123,
      status: 'cancelled',
      totalPrice: 200,
      currency: 'USD',
      updatedAt: '2026-10-31T12:00:00.000Z',
    });

    render(<OrderCancelAction orderId={123} orderNumber="ORD-2026-0123" />);

    await user.click(screen.getByRole('button', { name: 'Cancel order' }));
    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Cancel order?' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Keep order' }),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: 'Cancel order' }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(123);
    });
    expect(toastSuccess).toHaveBeenCalledWith('Order cancelled');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open and shows an inline error on failure', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new ApiRequestError({
        statusCode: 500,
        message: 'Upstream failure',
      }),
    );

    render(<OrderCancelAction orderId={123} orderNumber="ORD-2026-0123" />);

    await user.click(screen.getByRole('button', { name: 'Cancel order' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Cancel order',
      }),
    );

    expect(await screen.findByText('Upstream failure')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('maps an unauthenticated 401 without matching English API text', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new ApiRequestError({
        statusCode: 401,
        message: 'raw unauthorized body',
      }),
    );

    render(<OrderCancelAction orderId={123} orderNumber="ORD-2026-0123" />);

    await user.click(screen.getByRole('button', { name: 'Cancel order' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Cancel order',
      }),
    );

    expect(
      await screen.findByText(
        'Your session has expired. Sign in again to cancel this order.',
      ),
    ).toBeInTheDocument();
  });

  it('closes the dialog and surfaces the 409 message via toast', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new ApiRequestError({
        statusCode: 409,
        message: 'Order cannot be cancelled in current state',
        code: 'DOMAIN_ERROR',
      }),
    );

    render(<OrderCancelAction orderId={123} orderNumber="ORD-2026-0123" />);

    await user.click(screen.getByRole('button', { name: 'Cancel order' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Cancel order',
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(toastError).toHaveBeenCalledWith(
      'This order can no longer be cancelled.',
    );
  });

  it('returns focus to the cancel trigger after Keep order', async () => {
    const user = userEvent.setup();

    render(<OrderCancelAction orderId={123} orderNumber="ORD-2026-0123" />);

    const trigger = screen.getByRole('button', { name: 'Cancel order' });
    await user.click(trigger);
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Keep order',
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('returns focus to the cancel trigger after Escape', async () => {
    const user = userEvent.setup();

    render(<OrderCancelAction orderId={123} orderNumber="ORD-2026-0123" />);

    const trigger = screen.getByRole('button', { name: 'Cancel order' });
    await user.click(trigger);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });
});
