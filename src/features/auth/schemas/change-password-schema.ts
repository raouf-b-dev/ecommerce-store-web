import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: 'New password must differ from current password',
    path: ['newPassword'],
  })
  .refine((values) => values.confirmPassword === values.newPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
