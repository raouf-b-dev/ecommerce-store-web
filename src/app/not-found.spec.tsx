// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotFound from '@/app/not-found';

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    session: null,
    sessionError: null,
    retrySession: vi.fn(),
  }),
}));

vi.mock('@/components/layout/storefront-chrome', () => ({
  StorefrontChrome: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="storefront-chrome">{children}</div>
  ),
}));

describe('Root NotFound', () => {
  it('renders a generic page-not-found header', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('That address is not a storefront page.'),
    ).toBeInTheDocument();
  });
});
