'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  matchAddressField,
  type AddressFormField,
} from '@/features/account/lib/match-address-field';
import {
  addAddressFormSchema,
  updateAddressFormSchema,
  type AddAddressFormValues,
  type UpdateAddressFormValues,
} from '@/features/account/schemas/address-schema';
import type { AddressResponseDto, AddressType } from '@/features/account/types';

const ADDRESS_TYPE_OPTIONS: AddressType[] = [
  'HOME',
  'WORK',
  'OTHER',
  'BILLING',
  'SHIPPING',
];

const SELECT_CLASS_NAME =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30';

type AddressFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  initialAddress?: AddressResponseDto | null;
  onSubmit: (
    values: AddAddressFormValues | UpdateAddressFormValues,
  ) => Promise<void>;
  isPending: boolean;
  error?: string | null;
};

function emptyDefaults(): AddAddressFormValues {
  return {
    street: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    type: 'SHIPPING',
    deliveryInstructions: '',
    isDefault: false,
  };
}

function fromAddress(address: AddressResponseDto): AddAddressFormValues {
  return {
    street: address.street,
    street2: address.street2 ?? '',
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    type: address.type,
    deliveryInstructions: address.deliveryInstructions ?? '',
    isDefault: address.isDefault,
  };
}

function toUpdateValues(values: AddAddressFormValues): UpdateAddressFormValues {
  return {
    street: values.street,
    street2: values.street2,
    city: values.city,
    state: values.state,
    postalCode: values.postalCode,
    country: values.country,
    type: values.type,
    deliveryInstructions: values.deliveryInstructions,
  };
}

export function AddressFormDialog({
  open,
  onOpenChange,
  mode,
  initialAddress,
  onSubmit,
  isPending,
  error,
}: AddressFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  // Form state always includes optional isDefault (add-only UX); edit schema omits it.
  // Parent remounts this dialog when opening so defaultValues stay fresh.
  const form = useForm<AddAddressFormValues>({
    resolver: zodResolver(
      mode === 'add' ? addAddressFormSchema : updateAddressFormSchema,
    ),
    defaultValues:
      mode === 'edit' && initialAddress
        ? fromAddress(initialAddress)
        : emptyDefaults(),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }
    onOpenChange(nextOpen);
  };

  async function handleSubmit(values: AddAddressFormValues) {
    setFormError(null);

    try {
      if (mode === 'edit') {
        await onSubmit(toUpdateValues(values));
      } else {
        await onSubmit(values);
      }
    } catch (submitError) {
      applyApiFormErrors<AddressFormField>({
        error: submitError,
        setFormError,
        setFieldError: (field, message) => {
          form.setError(field, { type: 'server', message });
        },
        matchField: matchAddressField,
        genericFallback:
          mode === 'add'
            ? 'Could not add address.'
            : 'Could not update address.',
      });
    }
  }

  const title = mode === 'add' ? 'Add address' : 'Edit address';
  const description =
    mode === 'add'
      ? 'Save a shipping or billing address to your account.'
      : 'Update this address. Use “Set as default” on the card to change the default.';

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto data-[size=default]:max-w-lg data-[size=default]:sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleSubmit)}
          noValidate
        >
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.street)}>
              <FieldLabel htmlFor="address-street">Street</FieldLabel>
              <Input
                id="address-street"
                autoComplete="address-line1"
                disabled={isPending}
                aria-invalid={Boolean(form.formState.errors.street)}
                {...form.register('street')}
              />
              <FieldError>{form.formState.errors.street?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.street2)}>
              <FieldLabel htmlFor="address-street2">
                Apartment, suite, etc. (optional)
              </FieldLabel>
              <Input
                id="address-street2"
                autoComplete="address-line2"
                disabled={isPending}
                aria-invalid={Boolean(form.formState.errors.street2)}
                {...form.register('street2')}
              />
              <FieldError>{form.formState.errors.street2?.message}</FieldError>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(form.formState.errors.city)}>
                <FieldLabel htmlFor="address-city">City</FieldLabel>
                <Input
                  id="address-city"
                  autoComplete="address-level2"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.city)}
                  {...form.register('city')}
                />
                <FieldError>{form.formState.errors.city?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.state)}>
                <FieldLabel htmlFor="address-state">State / province</FieldLabel>
                <Input
                  id="address-state"
                  autoComplete="address-level1"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.state)}
                  {...form.register('state')}
                />
                <FieldError>{form.formState.errors.state?.message}</FieldError>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(form.formState.errors.postalCode)}>
                <FieldLabel htmlFor="address-postalCode">Postal code</FieldLabel>
                <Input
                  id="address-postalCode"
                  autoComplete="postal-code"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.postalCode)}
                  {...form.register('postalCode')}
                />
                <FieldError>
                  {form.formState.errors.postalCode?.message}
                </FieldError>
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.country)}>
                <FieldLabel htmlFor="address-country">Country</FieldLabel>
                <Input
                  id="address-country"
                  autoComplete="country"
                  maxLength={2}
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.country)}
                  {...form.register('country')}
                />
                <FieldError>{form.formState.errors.country?.message}</FieldError>
              </Field>
            </div>

            <Field data-invalid={Boolean(form.formState.errors.type)}>
              <FieldLabel htmlFor="address-type">Type</FieldLabel>
              <select
                id="address-type"
                className={SELECT_CLASS_NAME}
                disabled={isPending}
                aria-invalid={Boolean(form.formState.errors.type)}
                {...form.register('type')}
              >
                {ADDRESS_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <FieldError>{form.formState.errors.type?.message}</FieldError>
            </Field>

            <Field
              data-invalid={Boolean(form.formState.errors.deliveryInstructions)}
            >
              <FieldLabel htmlFor="address-deliveryInstructions">
                Delivery instructions (optional)
              </FieldLabel>
              <Input
                id="address-deliveryInstructions"
                disabled={isPending}
                aria-invalid={Boolean(
                  form.formState.errors.deliveryInstructions,
                )}
                {...form.register('deliveryInstructions')}
              />
              <FieldError>
                {form.formState.errors.deliveryInstructions?.message}
              </FieldError>
            </Field>

            {mode === 'add' ? (
              <Field
                orientation="horizontal"
                data-invalid={Boolean(form.formState.errors.isDefault)}
              >
                <input
                  id="address-isDefault"
                  type="checkbox"
                  className="size-4 rounded border border-input"
                  disabled={isPending}
                  {...form.register('isDefault')}
                />
                <FieldLabel htmlFor="address-isDefault">
                  Set as default address
                </FieldLabel>
                <FieldError>
                  {form.formState.errors.isDefault?.message}
                </FieldError>
              </Field>
            ) : null}
          </FieldGroup>

          <ActionErrorAlert
            message={formError ?? error}
            title={
              mode === 'add' ? 'Could not add address' : 'Could not update address'
            }
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? mode === 'add'
                  ? 'Saving…'
                  : 'Updating…'
                : mode === 'add'
                  ? 'Add address'
                  : 'Save changes'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
