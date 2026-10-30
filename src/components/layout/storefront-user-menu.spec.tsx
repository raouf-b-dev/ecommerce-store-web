import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { StorefrontUserMenu } from './storefront-user-menu';
import type { useAuth } from '@/lib/auth/auth-context';
import type { useTheme } from '@/components/theme/use-theme';

type AuthStub = Pick<
  ReturnType<typeof useAuth>,
  'status' | 'session' | 'logout'
>;

type SetTheme = ReturnType<typeof useTheme>['setTheme'];

const auth = vi.hoisted(() => vi.fn<() => AuthStub>());
const mockLogout = vi.hoisted(() => vi.fn<() => Promise<void>>());
const mockSetTheme = vi.hoisted(() => vi.fn<SetTheme>());

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: auth,
}));

vi.mock('@/components/theme/use-theme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  }),
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

describe('StorefrontUserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogout.mockResolvedValue(undefined);
    setAuthState();
  });

  it('renders a loading placeholder without interactive buttons or links', () => {
    setAuthState({ status: 'loading' });

    render(<StorefrontUserMenu />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders sign in and create account buttons when unauthenticated', () => {
    setAuthState({ status: 'unauthenticated' });

    render(<StorefrontUserMenu />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Theme selector' })).toBeInTheDocument();
  });

  it('renders avatar button with initial and email prefix when authenticated', () => {
    setAuthState({
      status: 'authenticated',
      session: {
        userId: '1',
        email: 'customer@example.com',
        role: 'customer',
        permissions: [],
        mustChangePassword: false,
      },
    });

    render(<StorefrontUserMenu />);

    const trigger = screen.getByRole('button', {
      name: 'User account menu for customer@example.com',
    });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('customer')).toBeInTheDocument();
  });

  it('opens menu with userEvent click and renders navigation and theme radio items', async () => {
    const user = userEvent.setup();
    setAuthState({
      status: 'authenticated',
      session: {
        userId: '3',
        email: 'shopper@example.com',
        role: 'store_manager',
        permissions: ['change_own_credentials'],
        mustChangePassword: false,
      },
    });

    render(<StorefrontUserMenu />);

    const trigger = screen.getByRole('button', {
      name: 'User account menu for shopper@example.com',
    });
    await user.click(trigger);

    expect(screen.getByText('shopper@example.com')).toBeInTheDocument();
    expect(screen.getByText('store manager')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /my orders/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /account settings/i })).toBeInTheDocument();
    const changePassword = screen.getByRole('menuitem', {
      name: /change password/i,
    });
    expect(changePassword).toBeInTheDocument();
    expect(changePassword).toHaveAttribute(
      'href',
      '/change-password?redirect=%2Faccount',
    );
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'System' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
  });

  it('hides change password when session lacks change_own_credentials', async () => {
    const user = userEvent.setup();
    setAuthState({
      status: 'authenticated',
      session: {
        userId: '8',
        email: 'readonly@example.com',
        role: 'customer',
        permissions: ['manage_own_cart', 'view_own_orders'],
        mustChangePassword: false,
      },
    });

    render(<StorefrontUserMenu />);

    const trigger = screen.getByRole('button', {
      name: 'User account menu for readonly@example.com',
    });
    await user.click(trigger);

    expect(screen.getByRole('menuitem', { name: /my orders/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /account settings/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /change password/i }),
    ).not.toBeInTheDocument();
  });

  it('allows picking a theme using keyboard navigation', async () => {
    const user = userEvent.setup();
    setAuthState({
      status: 'authenticated',
      session: {
        userId: '10',
        email: 'shopper@example.com',
        role: 'customer',
        permissions: [],
        mustChangePassword: false,
      },
    });

    render(<StorefrontUserMenu />);

    const trigger = screen.getByRole('button', {
      name: 'User account menu for shopper@example.com',
    });
    trigger.focus();
    await user.keyboard('{Enter}');

    const darkOption = await screen.findByRole('menuitemradio', { name: 'Dark' });
    await user.click(darkOption);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('closes menu when Escape key is pressed', async () => {
    const user = userEvent.setup();
    setAuthState({
      status: 'authenticated',
      session: {
        userId: '4',
        email: 'shopper@example.com',
        role: 'customer',
        permissions: [],
        mustChangePassword: false,
      },
    });

    render(<StorefrontUserMenu />);

    const trigger = screen.getByRole('button', {
      name: 'User account menu for shopper@example.com',
    });
    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: /my orders/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /my orders/i })).not.toBeInTheDocument();
    });
  });

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    setAuthState({
      status: 'authenticated',
      session: {
        userId: '5',
        email: 'shopper@example.com',
        role: 'customer',
        permissions: [],
        mustChangePassword: false,
      },
    });

    render(<StorefrontUserMenu />);

    const trigger = screen.getByRole('button', {
      name: 'User account menu for shopper@example.com',
    });
    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: /my orders/i })).toBeInTheDocument();

    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /my orders/i })).not.toBeInTheDocument();
    });
  });

  it('executes sign-out successfully and calls onNavigate', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn<() => void>();
    setAuthState({
      status: 'authenticated',
      session: {
        userId: '6',
        email: 'shopper@example.com',
        role: 'customer',
        permissions: [],
        mustChangePassword: false,
      },
    });

    render(<StorefrontUserMenu onNavigate={onNavigate} />);

    const trigger = screen.getByRole('button', {
      name: 'User account menu for shopper@example.com',
    });
    await user.click(trigger);

    const signOutItem = screen.getByRole('menuitem', { name: /sign out/i });
    await user.click(signOutItem);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('surfaces toast error when sign-out rejects', async () => {
    const user = userEvent.setup();
    mockLogout.mockRejectedValueOnce(new Error('Network failure'));
    setAuthState({
      status: 'authenticated',
      session: {
        userId: '7',
        email: 'shopper@example.com',
        role: 'customer',
        permissions: [],
        mustChangePassword: false,
      },
    });

    render(<StorefrontUserMenu />);

    const trigger = screen.getByRole('button', {
      name: 'User account menu for shopper@example.com',
    });
    await user.click(trigger);

    const signOutItem = screen.getByRole('menuitem', { name: /sign out/i });
    await user.click(signOutItem);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Network failure');
  });
});
