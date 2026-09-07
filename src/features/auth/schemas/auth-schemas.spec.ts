import { describe, expect, it } from 'vitest';
import { loginSchema } from '@/features/auth/schemas/login-schema';
import { registerSchema } from '@/features/auth/schemas/register-schema';

describe('loginSchema', () => {
  it('requires a valid email and a password', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        'Enter a valid email',
      );
      expect(result.error.flatten().fieldErrors.password).toContain(
        'Password is required',
      );
    }
  });
});

describe('registerSchema', () => {
  it('aligns required fields and password minimum with RegisterDto', () => {
    const result = registerSchema.safeParse({
      firstName: '',
      lastName: '',
      email: 'bad',
      password: '12345',
      phone: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.firstName).toContain('First name is required');
      expect(errors.lastName).toContain('Last name is required');
      expect(errors.email).toContain('Enter a valid email');
      expect(errors.password).toContain(
        'Password must be at least 6 characters',
      );
    }
  });
});
