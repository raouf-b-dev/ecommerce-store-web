import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestRoute } from '@/lib/auth/guest-route';
import { ProtectedRoute } from '@/lib/auth/protected-route';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  retrySession: vi.fn(),
  auth: {
    status: 'loading',
    sessionError: null as unknown,
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
});

describe('GuestRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.sessionError = null;
  });

  it('redirects an authenticated shopper through safeRedirectPath', async () => {
    mocks.auth.status = 'authenticated';
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
});
