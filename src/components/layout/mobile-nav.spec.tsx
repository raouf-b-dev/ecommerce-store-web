import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileNav } from '@/components/layout/mobile-nav';
import type { useAuth } from '@/lib/auth/auth-context';
import type { useTheme } from '@/components/theme/use-theme';

type AuthStub = Pick<ReturnType<typeof useAuth>, 'status'>;

const auth = vi.hoisted(() => vi.fn<() => AuthStub>());
const theme = vi.hoisted(() => vi.fn<typeof useTheme>());

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: auth,
}));

vi.mock('@/components/theme/use-theme', () => ({
  useTheme: theme,
}));

async function openMenu(): Promise<HTMLElement> {
  const user = userEvent.setup();
  render(<MobileNav />);
  const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
  await user.click(trigger);
  return trigger;
}

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockReturnValue({ status: 'authenticated' });
    theme.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      resolvedTheme: 'light',
    });
  });

  it('opens from the menu button and closes on Escape', async () => {
    const user = userEvent.setup();

    render(<MobileNav />);

    const trigger = screen.getByRole('button', {
      name: 'Open navigation menu',
    });
    await user.click(trigger);
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
    expect(screen.getByText('Storefront sections')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('offers create account and the theme selector when unauthenticated', async () => {
    auth.mockReturnValue({ status: 'unauthenticated' });

    await openMenu();

    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(
      screen.getByRole('radiogroup', { name: 'Theme selector' }),
    ).toBeInTheDocument();
  });

  it('offers create account and the theme selector when session bootstrap failed', async () => {
    auth.mockReturnValue({ status: 'error' });

    await openMenu();

    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(
      screen.getByRole('radiogroup', { name: 'Theme selector' }),
    ).toBeInTheDocument();
  });

  it('omits guest actions when authenticated', async () => {
    await openMenu();

    expect(
      screen.queryByRole('link', { name: 'Create account' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('radiogroup', { name: 'Theme selector' }),
    ).not.toBeInTheDocument();
  });

  it('omits guest actions while the session is loading', async () => {
    auth.mockReturnValue({ status: 'loading' });

    await openMenu();

    expect(
      screen.queryByRole('link', { name: 'Create account' }),
    ).not.toBeInTheDocument();
  });
});
