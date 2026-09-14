'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  CreditCard,
  Lock,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ActionErrorAlert } from '@/components/feedback/action-error-alert';
import { formatMoney } from '@/lib/format';
import { hasHttpStatus } from '@/lib/api/parse-api-error';
import { applyApiFormErrors } from '@/lib/api/form-api-errors';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useUserProfile } from '@/features/account/hooks/use-user-profile';
import { parseSessionUserId } from '@/features/account/lib/parse-session-user-id';
import { formatAddressLines } from '@/features/account/lib/format-address';
import { useCheckoutMutation } from '@/features/checkout/hooks/use-checkout-mutation';
import {
  checkoutFormSchema,
  type CheckoutFormValues,
} from '@/features/checkout/schemas/checkout-schema';
import {
  matchCheckoutField,
  type CheckoutFormField,
} from '@/features/checkout/lib/match-checkout-field';

interface CheckoutFormProps {
  onOrderCreated: (orderId: number) => void;
}

export function CheckoutForm({ onOrderCreated }: CheckoutFormProps) {
  const { session } = useAuth();
  const userId = parseSessionUserId(session?.userId);
  const { user: profile, isLoading: isProfileLoading } = useUserProfile(userId);
  const defaultAddress = profile?.addresses.find((address) => address.isDefault);

  const { cart, itemCount, totalAmount, isLoading: isCartLoading } = useCart();
  const currency = cart?.currency ?? 'USD';
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    mutateAsync: submitCheckout,
    isPending,
  } = useCheckoutMutation({
    onSuccess: (data) => {
      onOrderCreated(data.orderId);
    },
  });

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      useDefaultAddress: true,
      paymentMethod: 'STRIPE',
      customerNotes: '',
      shippingAddress: {
        firstName: '',
        lastName: '',
        street: '',
        street2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
        phone: '',
        deliveryInstructions: '',
      },
    },
  });

  const useDefaultAddress = useWatch({
    control: form.control,
    name: 'useDefaultAddress',
  });

  useEffect(() => {
    if (isProfileLoading || !profile) {
      return;
    }
    if (!defaultAddress) {
      form.setValue('useDefaultAddress', false);
    }
  }, [isProfileLoading, profile, defaultAddress, form]);

  const onSubmit = async (values: CheckoutFormValues) => {
    setGeneralError(null);
    try {
      await submitCheckout(values);
    } catch (error) {
      if (hasHttpStatus(error, 409)) {
        setGeneralError(
          'A checkout transaction is currently in progress for this order. Please wait a few seconds and try again.',
        );
      } else if (hasHttpStatus(error, 503)) {
        setGeneralError(
          'The checkout service is temporarily unavailable. Please try again shortly.',
        );
      } else if (hasHttpStatus(error, 429)) {
        setGeneralError(
          'Too many requests. Please wait a moment before trying again.',
        );
      } else {
        applyApiFormErrors<CheckoutFormField>({
          error,
          setFormError: setGeneralError,
          setFieldError: (field, message) => {
            form.setError(field, { type: 'server', message });
          },
          matchField: matchCheckoutField,
          genericFallback:
            'Unable to process checkout. Please check your information and try again.',
        });
      }
    }
  };

  if (!isCartLoading && itemCount === 0) {
    return (
      <Card className="mx-auto max-w-xl text-center py-12">
        <CardHeader>
          <CardTitle className="text-2xl">Your Cart is Empty</CardTitle>
          <CardDescription>
            You do not have any items in your cart to checkout.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild size="lg">
            <Link href="/products">Explore Catalog</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column: Address, Payment & Notes */}
        <div className="space-y-6 lg:col-span-7">
          {/* Shipping Address Section */}
          <Card className="border shadow-xs">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Shipping Address
                </CardTitle>
              </div>
              <CardDescription>
                Select your default address on file or specify a custom destination.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Address Toggle Option */}
              <div className="space-y-3">
                <div
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    defaultAddress
                      ? 'hover:bg-muted/40'
                      : 'opacity-60'
                  }`}
                >
                  <input
                    id="address-option-saved"
                    type="radio"
                    name="addressOption"
                    className="mt-1 size-4 text-primary accent-primary"
                    checked={useDefaultAddress}
                    disabled={!defaultAddress}
                    onChange={() => form.setValue('useDefaultAddress', true)}
                  />
                  <label
                    htmlFor="address-option-saved"
                    className={defaultAddress ? 'cursor-pointer' : 'cursor-not-allowed'}
                  >
                    <span className="block text-sm font-medium text-foreground">
                      Use saved address on file
                    </span>
                    {defaultAddress && profile ? (
                      <span className="mt-1 block space-y-0.5 text-xs text-muted-foreground">
                        <span className="block font-medium text-foreground">
                          {profile.firstName} {profile.lastName}
                        </span>
                        {formatAddressLines(defaultAddress).map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="block text-xs text-muted-foreground">
                        {isProfileLoading
                          ? 'Loading your saved address…'
                          : 'No default address found. Enter a custom address below or '}
                        {!isProfileLoading && !defaultAddress ? (
                          <Link
                            href="/account"
                            className="font-medium text-foreground underline underline-offset-4"
                          >
                            add one in Account
                          </Link>
                        ) : null}
                        {!isProfileLoading && !defaultAddress ? '.' : null}
                      </span>
                    )}
                  </label>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                  <input
                    id="address-option-custom"
                    type="radio"
                    name="addressOption"
                    className="mt-1 size-4 text-primary accent-primary"
                    checked={!useDefaultAddress}
                    onChange={() => form.setValue('useDefaultAddress', false)}
                  />
                  <label htmlFor="address-option-custom" className="cursor-pointer">
                    <span className="block text-sm font-medium text-foreground">
                      Ship to a custom address
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Enter a new recipient and destination address for this delivery.
                    </span>
                  </label>
                </div>
              </div>

              {/* Custom Address Fields */}
              {!useDefaultAddress && (
                <div className="pt-4 border-t space-y-4 animate-in fade-in-50 duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                      <Input
                        id="firstName"
                        placeholder="Jane"
                        {...form.register('shippingAddress.firstName')}
                      />
                      <FieldError>
                        {form.formState.errors.shippingAddress?.firstName?.message}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...form.register('shippingAddress.lastName')}
                      />
                      <FieldError>
                        {form.formState.errors.shippingAddress?.lastName?.message}
                      </FieldError>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="street">Street Address</FieldLabel>
                    <Input
                      id="street"
                      placeholder="123 Market Street"
                      {...form.register('shippingAddress.street')}
                    />
                    <FieldError>
                      {form.formState.errors.shippingAddress?.street?.message}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="street2">
                      Apartment, suite, unit (optional)
                    </FieldLabel>
                    <Input
                      id="street2"
                      placeholder="Apt 4B"
                      {...form.register('shippingAddress.street2')}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="city">City</FieldLabel>
                      <Input
                        id="city"
                        placeholder="New York"
                        {...form.register('shippingAddress.city')}
                      />
                      <FieldError>
                        {form.formState.errors.shippingAddress?.city?.message}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="state">State / Province</FieldLabel>
                      <Input
                        id="state"
                        placeholder="NY"
                        {...form.register('shippingAddress.state')}
                      />
                      <FieldError>
                        {form.formState.errors.shippingAddress?.state?.message}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="postalCode">Postal Code</FieldLabel>
                      <Input
                        id="postalCode"
                        placeholder="10001"
                        {...form.register('shippingAddress.postalCode')}
                      />
                      <FieldError>
                        {form.formState.errors.shippingAddress?.postalCode?.message}
                      </FieldError>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="country">Country (2-Letter ISO Code)</FieldLabel>
                    <Input
                      id="country"
                      maxLength={2}
                      placeholder="US"
                      {...form.register('shippingAddress.country')}
                    />
                    <FieldError>
                      {form.formState.errors.shippingAddress?.country?.message}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="deliveryInstructions">
                      Delivery Instructions (optional)
                    </FieldLabel>
                    <Input
                      id="deliveryInstructions"
                      placeholder="Ring bell or leave at front desk"
                      {...form.register('shippingAddress.deliveryInstructions')}
                    />
                  </Field>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Section */}
          <Card className="border shadow-xs">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="size-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
              </div>
              <CardDescription>
                All transactions are encrypted and processed through our mock gateway.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start gap-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
                <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                  <CreditCard className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Mock Stripe Payment
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" /> Auto-Completing
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/80 dark:text-foreground/80">
                    Instant sandbox simulation: creates a Stripe PaymentIntent and
                    auto-completes via delayed asynchronous webhook.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Notes */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Order Notes</CardTitle>
              <CardDescription>
                Add any special requests or notes regarding your order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <Input
                  id="customerNotes"
                  placeholder="e.g. Please handle with extra care"
                  {...form.register('customerNotes')}
                />
                <FieldError>
                  {form.formState.errors.customerNotes?.message}
                </FieldError>
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Summary & CTA */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="border shadow-xs sticky top-8">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
              <CardDescription>
                Review your items and charges before placing your order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Item preview */}
              {cart?.items && cart.items.length > 0 && (
                <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
                    >
                      <div className="flex-1 pr-2 truncate">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × {formatMoney(item.price, currency)}
                        </p>
                      </div>
                      <span className="font-medium text-foreground">
                        {formatMoney(item.subtotal, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </span>
                  <span className="font-medium text-foreground">
                    {formatMoney(totalAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-emerald-800 dark:text-emerald-300">
                    Free
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-bold">
                  <span className="text-foreground">Total Due</span>
                  <span className="text-foreground">
                    {formatMoney(totalAmount, currency)}
                  </span>
                </div>
              </div>

              <ActionErrorAlert message={generalError} title="Checkout Notice" />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold shadow-sm"
                disabled={isPending || itemCount === 0}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing Order…
                  </span>
                ) : (
                  `Place Order • ${formatMoney(totalAmount, currency)}`
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>SSL Encrypted Checkout • Zero Risk Simulation</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}
