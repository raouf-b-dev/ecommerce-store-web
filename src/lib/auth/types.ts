import type { components } from '@/lib/api/generated/schema';

export type LoginCredentials = components['schemas']['LoginDto'];
export type RegisterInput = components['schemas']['RegisterDto'];
export type ChangePasswordInput = components['schemas']['ChangePasswordDto'];

export type AuthSession = {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  mustChangePassword: boolean;
};

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';
