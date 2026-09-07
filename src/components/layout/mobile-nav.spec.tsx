import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MobileNav } from '@/components/layout/mobile-nav';

vi.mock('@/components/layout/storefront-session-links', () => ({
  StorefrontSessionLinks: () => null,
}));

describe('MobileNav', () => {
  it('opens from the menu button and closes on Escape', async () => {
    const user = userEvent.setup();

    render(<MobileNav />);

    const trigger = screen.getByRole('button', {
      name: 'Open navigation menu',
    });
    await user.click(trigger);
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
    expect(screen.getByText('Storefront sections')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
});
