import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  changePassword: vi.fn(),
  logout: vi.fn(),
  clearAccessToken: vi.fn(),
  push: vi.fn(),
  refreshRouter: vi.fn(),
}));

vi.mock('@/lib/auth/session-api', () => ({
  buildSessionFromAccessToken: vi.fn(),
  changePasswordRequest: mocks.changePassword,
  loginRequest: vi.fn(),
  registerAndLoginRequest: vi.fn(),
  logoutRequest: mocks.logout,
  refreshSessionRequest: mocks.refresh,
}));
vi.mock('@/lib/auth/auth-session', () => ({
  clearAccessToken: mocks.clearAccessToken,
  getAccessToken: vi.fn(() => null),
}));
vi.mock('@/lib/api/silent-refresh', () => ({
  onSessionRefreshed: vi.fn(() => () => {}),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refreshRouter,
  }),
}));

const session = {
  userId: '42',
  email: 'shopper@example.com',
  role: 'CUSTOMER',
  permissions: [],
  mustChangePassword: false,
};

function Probe() {
  const { status, session, changePassword, logout } = useAuth();
  return (
    <>
      <span>{status}</span>
      <span>{String(session?.mustChangePassword)}</span>
      <button
        type="button"
        onClick={() =>
          void changePassword({
            currentPassword: 'Seed123!',
            newPassword: 'Rotated123!',
          })
        }
      >
        Change password
      </button>
      <button type="button" onClick={() => void logout().catch(() => {})}>
        Log out
      </button>
    </>
  );
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refresh.mockResolvedValue(session);
    mocks.changePassword.mockResolvedValue(session);
    mocks.logout.mockResolvedValue(undefined);
  });

  it('bootstraps the browser session', async () => {
    renderProvider();
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
  });

  it('represents a refresh 401 as unauthenticated', async () => {
    mocks.refresh.mockResolvedValue(null);
    renderProvider();
    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
  });

  it('represents a transient bootstrap failure as error', async () => {
    mocks.refresh.mockRejectedValue(new Error('API unavailable'));
    renderProvider();
    expect(await screen.findByText('error')).toBeInTheDocument();
  });

  it('replaces the cached session after password rotation', async () => {
    mocks.refresh.mockResolvedValue({ ...session, mustChangePassword: true });
    mocks.changePassword.mockResolvedValue(session);
    renderProvider();
    expect(await screen.findByText('true')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Change password' }),
    );
    expect(await screen.findByText('false')).toBeInTheDocument();
  });

  it('settles logout at unauthenticated instead of flashing loading', async () => {
    renderProvider();
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
    expect(mocks.clearAccessToken).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith('/login');
    expect(mocks.refreshRouter).toHaveBeenCalledOnce();
  });

  it('keeps the session visible when the server cannot revoke it', async () => {
    mocks.logout.mockRejectedValue(new Error('API unavailable'));
    renderProvider();
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
