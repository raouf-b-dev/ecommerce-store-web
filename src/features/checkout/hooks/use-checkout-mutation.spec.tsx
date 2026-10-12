import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { useRouter } from 'next/navigation';
import {
  useCheckoutMutation,
  type UseCheckoutMutationOptions,
} from './use-checkout-mutation';
import { checkoutRequest } from '@/features/checkout/api/checkout-api';
import { getCurrentCartRequest } from '@/features/cart/api/cart-api';
import { getOrCreateInFlightKey } from '@/features/checkout/lib/idempotency';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import type { useAuth } from '@/lib/auth/auth-context';
import type { CheckoutResponseDto } from '@/features/checkout/types';
import type { CheckoutFormValues } from '@/features/checkout/schemas/checkout-schema';
import { createMockCart } from '@/test/fixtures/cart.fixture';

vi.mock('@/features/checkout/api/checkout-api');
vi.mock('@/features/cart/api/cart-api');
vi.mock('@/features/checkout/lib/idempotency');

const refresh = vi.hoisted(() => vi.fn<ReturnType<typeof useRouter>['refresh']>());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

type AuthStub = Pick<ReturnType<typeof useAuth>, 'session'>;
const auth = vi.hoisted(() => vi.fn<() => AuthStub>());
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: auth,
}));

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useCheckoutMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockReturnValue({
      session: {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'customer',
        permissions: [],
        mustChangePassword: false,
      },
    });
    vi.mocked(getOrCreateInFlightKey).mockReturnValue('test-idempotency-key-123');
  });

  it('submits checkout request without idempotencyKey in the body and sends it as header argument', async () => {
    const mockResponse: CheckoutResponseDto = {
      orderId: 101,
      jobId: 'job-101',
      status: 'pending_payment',
      message: 'Checkout process started.',
    };
    vi.mocked(checkoutRequest).mockResolvedValue(mockResponse);

    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(cartKeys.current('user-1'), createMockCart({ id: 42 }));

    const onSuccess = vi.fn<NonNullable<UseCheckoutMutationOptions['onSuccess']>>();
    const { result } = renderHook(() => useCheckoutMutation({ onSuccess }), { wrapper });

    const formValues: CheckoutFormValues = {
      useDefaultAddress: true,
      paymentMethod: 'CARD',
      customerNotes: 'Please leave at the front door',
    };

    let response: CheckoutResponseDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync(formValues);
    });

    expect(response).toEqual(mockResponse);
    expect(checkoutRequest).toHaveBeenCalledTimes(1);
    expect(checkoutRequest).toHaveBeenCalledWith(
      {
        cartId: 42,
        paymentMethod: 'CARD',
        customerNotes: 'Please leave at the front door',
        shippingAddress: undefined,
      },
      'test-idempotency-key-123',
    );

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(mockResponse);
  });

  it('submits custom shipping address in body without idempotencyKey', async () => {
    const mockResponse: CheckoutResponseDto = {
      orderId: 102,
      jobId: 'job-102',
      status: 'pending_payment',
      message: 'Checkout process started.',
    };
    vi.mocked(checkoutRequest).mockResolvedValue(mockResponse);

    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(cartKeys.current('user-1'), createMockCart({ id: 50 }));

    const { result } = renderHook(() => useCheckoutMutation(), { wrapper });

    const formValues: CheckoutFormValues = {
      useDefaultAddress: false,
      paymentMethod: 'CARD',
      shippingAddress: {
        firstName: 'Jane',
        lastName: 'Doe',
        street: '123 Market St',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
    };

    await act(async () => {
      await result.current.mutateAsync(formValues);
    });

    expect(checkoutRequest).toHaveBeenCalledTimes(1);
    expect(checkoutRequest).toHaveBeenCalledWith(
      {
        cartId: 50,
        paymentMethod: 'CARD',
        customerNotes: undefined,
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Doe',
          street: '123 Market St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      },
      'test-idempotency-key-123',
    );
  });

  it('throws an error and skips checkoutRequest when cart is missing or empty', async () => {
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(cartKeys.current('user-1'), null);
    vi.mocked(getCurrentCartRequest).mockResolvedValue(null);

    const { result } = renderHook(() => useCheckoutMutation(), { wrapper });

    const formValues: CheckoutFormValues = {
      useDefaultAddress: true,
      paymentMethod: 'CARD',
    };

    await act(async () => {
      await expect(result.current.mutateAsync(formValues)).rejects.toThrow(
        'Your cart is empty or expired. Please add items before checking out.',
      );
    });

    expect(checkoutRequest).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
