import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestRoute } from '@/lib/auth/guest-route';
import {
  ChangePasswordRoute,
  RequirePasswordChanged,
} from '@/lib/auth/password-change-routes';
import { ProtectedRoute } from '@/lib/auth/protected-route';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  retrySession: vi.fn(),
  auth: {
    status: 'loading',
    sessionError: null as unknown,
    mustChangePassword: false,
    session: null as {
      mustChangePassword: boolean;
      email: string;
    } | null,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => '/account',
  useSearchParams: () => new URLSearchParams('tab=orders'),
}));
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    ...mocks.auth,
    retrySession: mocks.retrySession,
  }),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.status = 'loading';
    mocks.auth.sessionError = null;
    mocks.auth.mustChangePassword = false;
    mocks.auth.session = null;
  });

  it('shows an honest loading state during browser session bootstrap', () => {
    render(<ProtectedRoute>Private account</ProtectedRoute>);
    expect(screen.getByText('Loading session…')).toBeInTheDocument();
  });

  it('redirects only an explicitly unauthenticated shopper', async () => {
    mocks.auth.status = 'unauthenticated';
    render(<ProtectedRoute>Private account</ProtectedRoute>);
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/login?redirect=%2Faccount%3Ftab%3Dorders',
      );
    });
  });

  it('shows a retry surface for API outages instead of redirecting', async () => {
    mocks.auth.status = 'error';
    mocks.auth.sessionError = new Error('API unavailable');
    render(<ProtectedRoute>Private account</ProtectedRoute>);
    expect(screen.getByText('Could not load session')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mocks.retrySession).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('renders authenticated children', () => {
    mocks.auth.status = 'authenticated';
    render(<ProtectedRoute>Private account</ProtectedRoute>);
    expect(screen.getByText('Private account')).toBeInTheDocument();
  });

  it('blocks a flagged session and preserves the account destination', async () => {
    mocks.auth.status = 'authenticated';
    mocks.auth.mustChangePassword = true;
    render(<ProtectedRoute>Private account</ProtectedRoute>);
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/change-password?redirect=%2Faccount%3Ftab%3Dorders',
      );
    });
    expect(screen.queryByText('Private account')).not.toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.sessionError = null;
    mocks.auth.mustChangePassword = false;
    mocks.auth.session = null;
  });

  it('redirects an authenticated shopper through safeRedirectPath', async () => {
    mocks.auth.status = 'authenticated';
    mocks.auth.session = {
      email: 'shopper@example.com',
      mustChangePassword: false,
    };
    render(<GuestRoute>Sign in form</GuestRoute>);
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/');
    });
  });

  it('renders auth forms for an unauthenticated shopper', () => {
    mocks.auth.status = 'unauthenticated';
    render(<GuestRoute>Sign in form</GuestRoute>);
    expect(screen.getByText('Sign in form')).toBeInTheDocument();
  });

  it('sends a flagged authenticated shopper to password rotation', async () => {
    mocks.auth.status = 'authenticated';
    mocks.auth.session = {
      email: 'shopper@example.com',
      mustChangePassword: true,
    };
    render(<GuestRoute>Sign in form</GuestRoute>);
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/change-password?redirect=%2F',
      );
    });
  });
});

describe('forced-password routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.status = 'loading';
    mocks.auth.sessionError = null;
    mocks.auth.mustChangePassword = false;
    mocks.auth.session = null;
    window.history.replaceState({}, '', '/products?category=books');
  });

  it('does not block public content during session bootstrap', () => {
    render(
      <RequirePasswordChanged>Public catalog</RequirePasswordChanged>,
    );
    expect(screen.getByText('Public catalog')).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('redirects a flagged storefront session without hiding content', async () => {
    mocks.auth.status = 'authenticated';
    mocks.auth.session = {
      email: 'shopper@example.com',
      mustChangePassword: true,
    };
    render(
      <RequirePasswordChanged>Public catalog</RequirePasswordChanged>,
    );
    expect(screen.getByText('Public catalog')).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/change-password?redirect=%2Fproducts%3Fcategory%3Dbooks',
      );
    });
  });

  it('allows only flagged authenticated sessions onto the change page', () => {
    mocks.auth.status = 'authenticated';
    mocks.auth.session = {
      email: 'shopper@example.com',
      mustChangePassword: true,
    };
    render(<ChangePasswordRoute>Rotation form</ChangePasswordRoute>);
    expect(screen.getByText('Rotation form')).toBeInTheDocument();
  });

  it('redirects clean sessions away from the change page', async () => {
    mocks.auth.status = 'authenticated';
    mocks.auth.session = {
      email: 'shopper@example.com',
      mustChangePassword: false,
    };
    render(<ChangePasswordRoute>Rotation form</ChangePasswordRoute>);
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByText('Rotation form')).not.toBeInTheDocument();
  });

  it('shows session errors instead of redirecting', async () => {
    mocks.auth.status = 'error';
    mocks.auth.sessionError = new Error('API unavailable');
    render(<ChangePasswordRoute>Rotation form</ChangePasswordRoute>);
    expect(screen.getByText('Could not load session')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mocks.retrySession).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
