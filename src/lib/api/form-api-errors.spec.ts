import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api/parse-api-error';
import { applyApiFormErrors } from '@/lib/api/form-api-errors';

type Field = 'email';

describe('applyApiFormErrors', () => {
  it('skips inline errors only for a coded OCC conflict', () => {
    const setFormError = vi.fn();
    const setFieldError = vi.fn();
    applyApiFormErrors({
      error: new ApiRequestError({
        statusCode: 409,
        code: 'OPTIMISTIC_LOCK_CONFLICT',
        message: 'Reload required',
      }),
      setFormError,
      setFieldError,
    });
    expect(setFormError).not.toHaveBeenCalled();
    expect(setFieldError).not.toHaveBeenCalled();
  });

  it('shows an ordinary 409 such as duplicate email', () => {
    const setFormError = vi.fn();
    applyApiFormErrors({
      error: new ApiRequestError({
        statusCode: 409,
        message: 'User with this email already exists',
      }),
      setFormError,
      setFieldError: vi.fn(),
    });
    expect(setFormError).toHaveBeenCalledWith(
      'User with this email already exists',
    );
  });

  it('maps validation lines and keeps unmapped lines at form level', () => {
    const setFormError = vi.fn();
    const setFieldError = vi.fn();
    applyApiFormErrors<Field>({
      error: new ApiRequestError({
        statusCode: 400,
        message: 'Validation failed',
        errors: ['email must be valid', 'unknown constraint'],
      }),
      setFormError,
      setFieldError,
      matchField: (line) => (line.includes('email') ? 'email' : null),
    });
    expect(setFieldError).toHaveBeenCalledWith('email', 'email must be valid');
    expect(setFormError).toHaveBeenCalledWith('unknown constraint');
  });

  it('uses a generic fallback for unknown errors', () => {
    const setFormError = vi.fn();
    applyApiFormErrors({
      error: new Error('network'),
      setFormError,
      setFieldError: vi.fn(),
    });
    expect(setFormError).toHaveBeenCalledWith(
      'Something went wrong. Please try again.',
    );
  });
});
