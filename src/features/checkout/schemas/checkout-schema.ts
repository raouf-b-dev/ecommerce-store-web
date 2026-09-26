// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from 'zod';

export const shippingAddressSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  street: z.string().trim().min(1, 'Street address is required'),
  street2: z.string().trim().optional(),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State or province is required'),
  postalCode: z.string().trim().min(1, 'Postal code is required'),
  country: z
    .string()
    .trim()
    .length(2, 'Country must be a 2-letter ISO code')
    .toUpperCase(),
  phone: z.string().trim().optional(),
  deliveryInstructions: z.string().trim().optional(),
});

const optionalShippingAddressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  deliveryInstructions: z.string().optional(),
});

export const defaultAddressFormSchema = z.object({
  useDefaultAddress: z.literal(true),
  shippingAddress: optionalShippingAddressSchema.optional(),
  paymentMethod: z.literal('STRIPE'),
  customerNotes: z.string().trim().optional(),
});

export const customAddressFormSchema = z.object({
  useDefaultAddress: z.literal(false),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.literal('STRIPE'),
  customerNotes: z.string().trim().optional(),
});

export const checkoutFormSchema = z.discriminatedUnion('useDefaultAddress', [
  defaultAddressFormSchema,
  customAddressFormSchema,
]);

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
