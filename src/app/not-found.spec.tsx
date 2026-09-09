import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotFound from '@/app/not-found';

const mockHeaders = vi.hoisted(() => new Map<string, string>());

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => mockHeaders.get(name.toLowerCase()) ?? null,
  }),
}));

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
  beforeEach(() => {
    mockHeaders.clear();
  });

  it('renders custom ProductNotFound card when x-not-found-type is product', async () => {
    mockHeaders.set('x-not-found-type', 'product');

    const ui = await NotFound();
    render(ui);

    expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
    expect(
      screen.getByText(/The product you are looking for may have been removed/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to catalog' })).toHaveAttribute('href', '/');
  });

  it('renders generic Page not found header when x-not-found-type is absent', async () => {
    const ui = await NotFound();
    render(ui);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('That address is not a storefront page.')).toBeInTheDocument();
  });

  it('renders generic Page not found header when x-not-found-type has any other value', async () => {
    mockHeaders.set('x-not-found-type', 'unknown');

    const ui = await NotFound();
    render(ui);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
