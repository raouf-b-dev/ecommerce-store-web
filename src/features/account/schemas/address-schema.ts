import { z } from 'zod';

export const addressTypeSchema = z.enum([
  'HOME',
  'WORK',
  'OTHER',
  'BILLING',
  'SHIPPING',
]);

const addressRequiredFields = {
  street: z.string().trim().min(1, 'Street address is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State or province is required'),
  postalCode: z.string().trim().min(1, 'Postal code is required'),
  country: z
    .string()
    .trim()
    .length(2, 'Country must be a 2-letter ISO code')
    .toUpperCase(),
};

const addressOptionalFields = {
  street2: z.string().trim().optional(),
  type: addressTypeSchema.optional(),
  deliveryInstructions: z.string().trim().optional(),
};

/** Aligned to AddAddressDto — isDefault only on add. */
export const addAddressFormSchema = z.object({
  ...addressRequiredFields,
  ...addressOptionalFields,
  isDefault: z.boolean().optional(),
});

/**
 * Edit form UX: same required fields as add (existing address always has them),
 * without isDefault (use set-default mutation instead).
 */
export const updateAddressFormSchema = z.object({
  ...addressRequiredFields,
  ...addressOptionalFields,
});

export type AddAddressFormValues = z.infer<typeof addAddressFormSchema>;
export type UpdateAddressFormValues = z.infer<typeof updateAddressFormSchema>;
