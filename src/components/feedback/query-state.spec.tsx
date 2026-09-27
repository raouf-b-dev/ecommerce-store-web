import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QueryStateAlert } from '@/components/feedback/query-state';
import { ActionErrorAlert } from '@/components/feedback/action-error-alert';

describe('ActionErrorAlert', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<ActionErrorAlert message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the action error copy', () => {
    render(<ActionErrorAlert message="Cart is empty" />);
    expect(screen.getByText('Action failed')).toBeVisible();
    expect(screen.getByText('Cart is empty')).toBeVisible();
  });
});

describe('QueryStateAlert', () => {
  it('renders nothing when there is no error', () => {
    const { container } = render(
      <QueryStateAlert
        isError={false}
        hasData={false}
        error={null}
        onRetry={() => {}}
        resource="orders"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a hard failure and retries', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <QueryStateAlert
        isError
        hasData={false}
        error={new Error('network down')}
        onRetry={onRetry}
        resource="orders"
      />,
    );

    expect(screen.getByText('Could not load orders')).toBeVisible();
    expect(screen.getByText('network down')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows a soft refresh failure when data remains', () => {
    render(
      <QueryStateAlert
        isError
        hasData
        error={new Error('timeout')}
        onRetry={() => {}}
        resource="cart"
      />,
    );

    expect(screen.getByText('Could not refresh cart')).toBeVisible();
  });
});
