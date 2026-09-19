'use client';

import { lazy, Suspense, useState } from 'react';
import { isMockMode } from '@/lib/mock/is-mock-mode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ActionErrorAlert } from '@/components/feedback/action-error-alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { applyApiFormErrors } from '@/lib/api/form-api-errors';
import { hasHttpStatus } from '@/lib/api/parse-api-error';
import { AUTH_THROTTLE_MESSAGE } from '@/lib/auth/session-api';
import {
  getRegisterRedirectPath,
  navigateAfterLoginPath,
} from '@/lib/auth/auth-routes';
import { matchAuthField } from '@/features/auth/lib/match-auth-field';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login-schema';
import { useAuth } from '@/lib/auth/auth-context';

const DemoLoginActions = lazy(() => import('@/lib/mock/ui/demo-login-actions'));

const LOGIN_FIELDS = ['email', 'password'] as const;
type LoginField = (typeof LOGIN_FIELDS)[number];

type LoginFormProps = {
  redirect?: string | null;
};

export function LoginForm({ redirect }: LoginFormProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);

    try {
      const session = await login(values);
      router.push(navigateAfterLoginPath(session, redirect));
      router.refresh();
    } catch (error) {
      if (hasHttpStatus(error, 429)) {
        setFormError(AUTH_THROTTLE_MESSAGE);
        return;
      }

      if (hasHttpStatus(error, 401)) {
        setFormError('Invalid email or password.');
        return;
      }

      applyApiFormErrors<LoginField>({
        error,
        setFormError,
        setFieldError: (field, message) => {
          form.setError(field, { type: 'server', message });
        },
        matchField: (line) => matchAuthField(LOGIN_FIELDS, line),
        genericFallback: 'Invalid email or password.',
      });
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.password)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>
      </FieldGroup>

      <ActionErrorAlert message={formError} title="Could not sign in" />

      {isMockMode() ? (
        <Suspense fallback={null}>
          <DemoLoginActions
            onSelect={(credentials) => {
              form.setValue('email', credentials.email);
              form.setValue('password', credentials.password);
            }}
          />
        </Suspense>
      ) : null}

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-sm text-muted-foreground">
        Need an account?{' '}
        <Link
          href={getRegisterRedirectPath(redirect)}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create account
        </Link>
      </p>
    </form>
  );
}
