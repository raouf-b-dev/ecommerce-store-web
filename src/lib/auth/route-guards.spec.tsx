import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthStatus } from '@/lib/auth/types';
import { GuestRoute } from '@/lib/auth/guest-route';
import {
  ChangePasswordRoute,
  RequirePasswordChanged,
} from '@/lib/auth/password-change-routes';
import { ProtectedRoute } from '@/lib/auth/protected-route';

type MockSession = {
  email: string;
  mustChangePassword: boolean;
};

type MockAuth = {
  status: AuthStatus;
  sessionError: unknown;
  mustChangePassword: boolean;
  session: MockSession | null;
};

const mocks = vi.hoisted(() => {
  let pathname = '/account';
  let searchParams = new URLSearchParams('tab=orders');
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  const auth: MockAuth = {
    status: 'loading',
    sessionError: null,
    mustChangePassword: false,
    session: null,
  };

  return {
    replace: vi.fn(),
    retrySession: vi.fn(),
    auth,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getPathname() {
      return pathname;
    },
    getSearchParams() {
      return searchParams;
    },
    get pathname() {
      return pathname;
    },
    set pathname(value: string) {
      pathname = value;
      notify();
    },
    get searchParams() {
      return searchParams;
    },
    set searchParams(value: URLSearchParams) {
      searchParams = value;
      notify();
    },
  };
});

vi.mock('next/navigation', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    useRouter: () => ({ replace: mocks.replace }),
    usePathname: () =>
      useSyncExternalStore(
        mocks.subscribe,
        mocks.getPathname,
        mocks.getPathname,
      ),
    useSearchParams: () =>
      useSyncExternalStore(
        mocks.subscribe,
        mocks.getSearchParams,
        mocks.getSearchParams,
      ),
  };
});
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
    mocks.pathname = '/products';
    mocks.searchParams = new URLSearchParams('category=books');
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

  it('re-evaluates and redirects when pathname or search parameters change on client navigation', async () => {
    mocks.auth.status = 'authenticated';
    mocks.auth.session = {
      email: 'shopper@example.com',
      mustChangePassword: true,
    };
    const { rerender } = render(
      <RequirePasswordChanged>Public catalog</RequirePasswordChanged>,
    );
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/change-password?redirect=%2Fproducts%3Fcategory%3Dbooks',
      );
    });

    mocks.replace.mockClear();
    act(() => {
      mocks.pathname = '/cart';
      mocks.searchParams = new URLSearchParams('discount=vip');
    });
    rerender(
      <RequirePasswordChanged>Public catalog</RequirePasswordChanged>,
    );

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/change-password?redirect=%2Fcart%3Fdiscount%3Dvip',
      );
    });
  });

  it('preserves the redirect destination when an unauthenticated user hits change page', async () => {
    mocks.auth.status = 'unauthenticated';
    mocks.searchParams = new URLSearchParams('redirect=/account?tab=orders');
    render(<ChangePasswordRoute>Rotation form</ChangePasswordRoute>);
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/login?redirect=%2Faccount%3Ftab%3Dorders',
      );
    });
    expect(screen.queryByText('Rotation form')).not.toBeInTheDocument();
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
