import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { MobileNav } from '@/components/layout/mobile-nav';
import type { useAuth } from '@/lib/auth/auth-context';
import type { useTheme } from '@/components/theme/use-theme';

type AuthStub = Pick<
  ReturnType<typeof useAuth>,
  'status' | 'session' | 'logout'
>;

const auth = vi.hoisted(() => vi.fn<() => AuthStub>());
const mockLogout = vi.hoisted(() => vi.fn<() => Promise<void>>());
const theme = vi.hoisted(() => vi.fn<typeof useTheme>());
const mockUseCart = vi.hoisted(() =>
  vi.fn<() => { lineItemCount: number }>(),
);

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: auth,
}));

vi.mock('@/components/theme/use-theme', () => ({
  useTheme: theme,
}));

vi.mock('@/features/cart/hooks/use-cart', () => ({
  useCart: () => mockUseCart(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function setAuthState(overrides?: Partial<AuthStub>): void {
  auth.mockReturnValue({
    status: 'unauthenticated',
    session: null,
    logout: mockLogout,
    ...overrides,
  });
}

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
    mockLogout.mockResolvedValue(undefined);
    setAuthState({ status: 'authenticated', session: null });
    auth.mockReturnValue({
      status: 'authenticated',
      session: {
        userId: '1',
        email: 'customer@example.com',
        role: 'customer',
        permissions: [],
        mustChangePassword: false,
      },
      logout: mockLogout,
    });
    theme.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      resolvedTheme: 'light',
    });
    mockUseCart.mockReturnValue({ lineItemCount: 2 });
  });

  it('opens from the menu button and closes on Escape', async () => {
    const user = userEvent.setup();

    render(<MobileNav />);

    const trigger = screen.getByRole('button', {
      name: 'Open navigation menu',
    });
    await user.click(trigger);
    expect(screen.getByRole('heading', { name: 'Menu' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
    expect(
      screen.getByText('Storefront sections, cart, account, and appearance'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Sign in' }),
    ).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('offers cart, account links, sign out, and theme when authenticated', async () => {
    await openMenu();

    expect(screen.getByRole('link', { name: /cart/i })).toHaveAttribute(
      'href',
      '/cart',
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
    expect(
      screen.getByRole('link', { name: 'Account Settings' }),
    ).toHaveAttribute('href', '/account');
    expect(
      screen.queryByRole('link', { name: 'Change password' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign out' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Theme selector' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Create account' }),
    ).not.toBeInTheDocument();
  });

  it('offers change password when the session includes change_own_credentials', async () => {
    auth.mockReturnValue({
      status: 'authenticated',
      session: {
        userId: '1',
        email: 'customer@example.com',
        role: 'customer',
        permissions: ['change_own_credentials'],
        mustChangePassword: false,
      },
      logout: mockLogout,
    });

    await openMenu();

    expect(
      screen.getByRole('link', { name: 'Change password' }),
    ).toHaveAttribute('href', expect.stringContaining('/change-password'));
  });

  it('signs out from the drawer and closes it', async () => {
    const user = userEvent.setup();

    render(<MobileNav />);
    await user.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    );
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.queryByRole('heading', { name: 'Menu' }),
    ).not.toBeInTheDocument();
  });

  it('toasts when sign out fails', async () => {
    mockLogout.mockRejectedValueOnce(new Error('Network down'));
    const user = userEvent.setup();

    render(<MobileNav />);
    await user.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    );
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network down');
    });
    expect(screen.getByRole('heading', { name: 'Menu' })).toBeVisible();
  });

  it('offers cart, sign in, create account, and theme when unauthenticated', async () => {
    setAuthState({ status: 'unauthenticated' });

    await openMenu();

    expect(screen.getByRole('link', { name: /cart/i })).toHaveAttribute(
      'href',
      '/cart',
    );
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(
      screen.getByRole('link', { name: 'Create account' }),
    ).toHaveAttribute('href', '/register');
    expect(
      screen.getByRole('radiogroup', { name: 'Theme selector' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'My Orders' }),
    ).not.toBeInTheDocument();
  });

  it('offers guest actions when session bootstrap failed', async () => {
    setAuthState({ status: 'error' });

    await openMenu();

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(
      screen.getByRole('link', { name: 'Create account' }),
    ).toHaveAttribute('href', '/register');
    expect(
      screen.getByRole('radiogroup', { name: 'Theme selector' }),
    ).toBeInTheDocument();
  });

  it('omits account and theme actions while the session is loading', async () => {
    setAuthState({ status: 'loading' });

    await openMenu();

    expect(screen.getByRole('link', { name: /cart/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Create account' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'My Orders' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('radiogroup', { name: 'Theme selector' }),
    ).not.toBeInTheDocument();
  });
});
