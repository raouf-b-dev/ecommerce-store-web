// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

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
