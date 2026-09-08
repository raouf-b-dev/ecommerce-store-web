'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ActionErrorAlert } from '@/components/feedback/action-error-alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  PASSWORD_CHANGE_THROTTLE_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  isSessionExpiredError,
} from '@/features/auth/api/auth-api';
import {
  getLoginRedirectPath,
  navigateAfterLoginPath,
} from '@/features/auth/lib/auth-routes';
import { matchAuthField } from '@/features/auth/lib/match-auth-field';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/schemas/change-password-schema';
import { applyApiFormErrors } from '@/lib/api/form-api-errors';
import {
  getErrorMessage,
  hasHttpStatus,
} from '@/lib/api/parse-api-error';
import { useAuth } from '@/lib/auth/auth-context';

const CHANGE_PASSWORD_FIELDS = ['currentPassword', 'newPassword'] as const;
type ChangePasswordField = (typeof CHANGE_PASSWORD_FIELDS)[number];

type ChangePasswordFormProps = {
  redirect?: string | null;
};

export function ChangePasswordForm({ redirect }: ChangePasswordFormProps) {
  const { session, changePassword, logout, clearLocalSession } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null);

    try {
      const updatedSession = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      router.push(navigateAfterLoginPath(updatedSession, redirect));
      router.refresh();
    } catch (error) {
      if (hasHttpStatus(error, 429)) {
        setFormError(PASSWORD_CHANGE_THROTTLE_MESSAGE);
        return;
      }

      if (isSessionExpiredError(error)) {
        clearLocalSession();
        toast.error(SESSION_EXPIRED_MESSAGE);
        router.replace(getLoginRedirectPath(redirect));
        return;
      }

      if (hasHttpStatus(error, 401)) {
        form.setError('currentPassword', {
          type: 'server',
          message: 'Current password is incorrect',
        });
        return;
      }

      applyApiFormErrors<ChangePasswordField>({
        error,
        setFormError,
        setFieldError: (field, message) => {
          form.setError(field, { type: 'server', message });
        },
        matchField: (line) =>
          matchAuthField(CHANGE_PASSWORD_FIELDS, line),
        genericFallback:
          'Could not update password. Check your current password and try again.',
      });
    }
  }

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await logout();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not sign out. Try again.'));
      setIsSigningOut(false);
    }
  }

  return (
    <div className="space-y-6">
      {session ? (
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{session.email}</span>
        </p>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FieldGroup>
          <Field
            data-invalid={Boolean(form.formState.errors.currentPassword)}
          >
            <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              disabled={isSubmitting || isSigningOut}
              aria-invalid={Boolean(
                form.formState.errors.currentPassword,
              )}
              {...form.register('currentPassword')}
            />
            <FieldError>
              {form.formState.errors.currentPassword?.message}
            </FieldError>
          </Field>

          <Field data-invalid={Boolean(form.formState.errors.newPassword)}>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting || isSigningOut}
              aria-invalid={Boolean(form.formState.errors.newPassword)}
              {...form.register('newPassword')}
            />
            <FieldError>
              {form.formState.errors.newPassword?.message}
            </FieldError>
          </Field>

          <Field
            data-invalid={Boolean(form.formState.errors.confirmPassword)}
          >
            <FieldLabel htmlFor="confirmPassword">
              Confirm new password
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting || isSigningOut}
              aria-invalid={Boolean(
                form.formState.errors.confirmPassword,
              )}
              {...form.register('confirmPassword')}
            />
            <FieldError>
              {form.formState.errors.confirmPassword?.message}
            </FieldError>
          </Field>
        </FieldGroup>

        <ActionErrorAlert
          message={formError}
          title="Could not update password"
        />

        <Button
          className="w-full"
          type="submit"
          disabled={isSubmitting || isSigningOut}
        >
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>

      <Button
        className="w-full"
        variant="outline"
        type="button"
        disabled={isSubmitting || isSigningOut}
        onClick={() => {
          void handleLogout();
        }}
      >
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  );
}
