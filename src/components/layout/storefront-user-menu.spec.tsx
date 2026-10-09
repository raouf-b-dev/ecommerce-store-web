import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { StorefrontUserMenu } from './storefront-user-menu';

const mockLogout = vi.fn().mockResolvedValue(undefined);
let mockStatus = 'unauthenticated';
let mockSession: { email: string; role: string } | null = null;

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    status: mockStatus,
    session: mockSession,
    logout: mockLogout,
  }),
}));

vi.mock('@/components/theme/use-theme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('StorefrontUserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus = 'unauthenticated';
    mockSession = null;
  });

  it('renders sign in and register buttons when unauthenticated', () => {
    render(<StorefrontUserMenu />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create account' })).toBeInTheDocument();
  });

  it('renders avatar button with initial when authenticated', () => {
    mockStatus = 'authenticated';
    mockSession = { email: 'customer@example.com', role: 'customer' };

    render(<StorefrontUserMenu />);

    const avatarButton = screen.getByRole('button', {
      name: 'User account menu for customer@example.com',
    });
    expect(avatarButton).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders menu items when open', async () => {
    mockStatus = 'authenticated';
    mockSession = { email: 'customer@example.com', role: 'customer' };

    render(<StorefrontUserMenu defaultOpen />);

    await waitFor(() => {
      expect(screen.getByText('customer@example.com')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /my orders/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /account settings/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
    });
  });
});
