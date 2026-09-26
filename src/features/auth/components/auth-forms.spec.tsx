// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import {
  SESSION_EXPIRED_CODE,
} from '@/lib/auth/session-api';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  changePassword: vi.fn(),
  logout: vi.fn(),
  clearLocalSession: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    login: mocks.login,
    register: mocks.register,
    changePassword: mocks.changePassword,
    logout: mocks.logout,
    clearLocalSession: mocks.clearLocalSession,
    session: {
      email: 'shopper@example.com',
      mustChangePassword: true,
    },
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

  it('preserves the destination when password rotation is required', async () => {
    mocks.login.mockResolvedValue({ mustChangePassword: true });
    render(<LoginForm redirect="/account?tab=orders" />);
    await fillLogin();
    expect(mocks.push).toHaveBeenCalledWith(
      '/change-password?redirect=%2Faccount%3Ftab%3Dorders',
    );
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

async function fillChangePassword(
  currentPassword = 'Customer123!',
  newPassword = 'Rotated123!',
  confirmPassword = newPassword,
) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Current password'), currentPassword);
  await user.type(
    screen.getByLabelText('New password', { exact: true }),
    newPassword,
  );
  await user.type(
    screen.getByLabelText('Confirm new password'),
    confirmPassword,
  );
  await user.click(screen.getByRole('button', { name: 'Update password' }));
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logout.mockResolvedValue(undefined);
  });

  it('validates password difference and confirmation locally', async () => {
    render(<ChangePasswordForm />);
    await fillChangePassword('Customer123!', 'Customer123!', 'Different123!');
    expect(
      await screen.findByText(
        'New password must differ from current password',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'Current password is incorrect'],
    [429, 'Too many password-change attempts. Wait about a minute and try again.'],
  ])('maps HTTP %s to actionable feedback', async (statusCode, message) => {
    mocks.changePassword.mockRejectedValue(
      new ApiRequestError({ statusCode, message: 'raw API text' }),
    );
    render(<ChangePasswordForm />);
    await fillChangePassword();
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('clears session and replaces with login redirect on SESSION_EXPIRED', async () => {
    mocks.changePassword.mockRejectedValue(
      new ApiRequestError({
        statusCode: 401,
        code: SESSION_EXPIRED_CODE,
        message: 'Your session has expired. Please sign in again.',
      }),
    );
    render(<ChangePasswordForm redirect="/account?tab=orders" />);
    await fillChangePassword();
    expect(mocks.clearLocalSession).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith(
      '/login?redirect=%2Faccount%3Ftab%3Dorders',
    );
  });

  it('maps an un-coded 400 error to the form error banner rather than newPassword field', async () => {
    mocks.changePassword.mockRejectedValue(
      new ApiRequestError({
        statusCode: 400,
        message: 'New password must differ from current password',
      }),
    );
    render(<ChangePasswordForm />);
    await fillChangePassword();
    expect(
      await screen.findByText('New password must differ from current password'),
    ).toBeInTheDocument();
  });

  it('submits the DTO, restores the destination, and refreshes layouts', async () => {
    mocks.changePassword.mockResolvedValue({ mustChangePassword: false });
    render(<ChangePasswordForm redirect="/account?tab=orders" />);
    await fillChangePassword();
    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Customer123!',
      newPassword: 'Rotated123!',
    });
    expect(mocks.push).toHaveBeenCalledWith('/account?tab=orders');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('offers logout without exposing an account link', async () => {
    render(<ChangePasswordForm />);
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(mocks.logout).toHaveBeenCalledOnce();
  });
});
