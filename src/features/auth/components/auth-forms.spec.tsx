import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    login: mocks.login,
    register: mocks.register,
  }),
}));

async function fillLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'shopper@example.com');
  await user.type(screen.getByLabelText('Password'), 'secret1');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

async function fillRegister() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('First name'), 'Ada');
  await user.type(screen.getByLabelText('Last name'), 'Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Password'), 'secret1');
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows client validation without calling the API', async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'Invalid email or password.'],
    [429, 'Too many sign-in attempts. Wait about a minute and try again.'],
  ])('maps HTTP %s without conflating errors', async (statusCode, message) => {
    mocks.login.mockRejectedValue(
      new ApiRequestError({ statusCode, message: 'raw API text' }),
    );
    render(<LoginForm />);
    await fillLogin();
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('navigates through a validated redirect and refreshes layouts', async () => {
    mocks.login.mockResolvedValue({});
    render(<LoginForm redirect="/account" />);
    await fillLogin();
    expect(mocks.push).toHaveBeenCalledWith('/account');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows duplicate-email 409 instead of treating it as OCC', async () => {
    mocks.register.mockRejectedValue(
      new ApiRequestError({
        statusCode: 409,
        message: 'User with this email already exists',
      }),
    );
    render(<RegisterForm />);
    await fillRegister();
    expect(
      await screen.findByText('User with this email already exists'),
    ).toBeInTheDocument();
  });

  it('omits an empty optional phone and signs the new customer in', async () => {
    mocks.register.mockResolvedValue({});
    render(<RegisterForm redirect="/account" />);
    await fillRegister();
    expect(mocks.register).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'secret1',
    });
    expect(mocks.push).toHaveBeenCalledWith('/account');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
