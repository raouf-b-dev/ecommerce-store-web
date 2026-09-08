'use client';

import { useState } from 'react';
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
import { AUTH_THROTTLE_MESSAGE } from '@/features/auth/api/auth-api';
import {
  getLoginRedirectPath,
  navigateAfterLoginPath,
} from '@/features/auth/lib/auth-routes';
import { matchAuthField } from '@/features/auth/lib/match-auth-field';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/schemas/register-schema';
import { useAuth } from '@/lib/auth/auth-context';

const REGISTER_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'password',
  'phone',
] as const;
type RegisterField = (typeof REGISTER_FIELDS)[number];

type RegisterFormProps = {
  redirect?: string | null;
};

export function RegisterForm({ redirect }: RegisterFormProps) {
  const { register } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);

    const phone = values.phone?.trim();

    try {
      const session = await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        ...(phone ? { phone } : {}),
      });
      router.push(navigateAfterLoginPath(session, redirect));
      router.refresh();
    } catch (error) {
      if (hasHttpStatus(error, 429)) {
        setFormError(AUTH_THROTTLE_MESSAGE);
        return;
      }

      applyApiFormErrors<RegisterField>({
        error,
        setFormError,
        setFieldError: (field, message) => {
          form.setError(field, { type: 'server', message });
        },
        matchField: (line) => matchAuthField(REGISTER_FIELDS, line),
        genericFallback: 'Could not create account.',
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
        <Field data-invalid={Boolean(form.formState.errors.firstName)}>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <Input
            id="firstName"
            autoComplete="given-name"
            disabled={isSubmitting}
            aria-invalid={Boolean(form.formState.errors.firstName)}
            {...form.register('firstName')}
          />
          <FieldError>{form.formState.errors.firstName?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.lastName)}>
          <FieldLabel htmlFor="lastName">Last name</FieldLabel>
          <Input
            id="lastName"
            autoComplete="family-name"
            disabled={isSubmitting}
            aria-invalid={Boolean(form.formState.errors.lastName)}
            {...form.register('lastName')}
          />
          <FieldError>{form.formState.errors.lastName?.message}</FieldError>
        </Field>

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
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.phone)}>
          <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            disabled={isSubmitting}
            aria-invalid={Boolean(form.formState.errors.phone)}
            {...form.register('phone')}
          />
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </Field>
      </FieldGroup>

      <ActionErrorAlert message={formError} title="Could not create account" />

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={getLoginRedirectPath(redirect)}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
