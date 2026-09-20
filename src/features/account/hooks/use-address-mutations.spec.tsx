import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAddressMutations } from './use-address-mutations';
import { accountKeys } from './account-keys';
import * as accountApi from '@/features/account/api/account-api';

vi.mock('@/features/account/api/account-api', () => ({
  addAddressRequest: vi.fn(),
  updateAddressRequest: vi.fn(),
  deleteAddressRequest: vi.fn(),
  setDefaultAddressRequest: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient, invalidateSpy };
}

describe('useAddressMutations', () => {
  const addDto: Parameters<
    ReturnType<typeof useAddressMutations>['addAddress']['mutateAsync']
  >[0] = {
    street: '1 Demo Way',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'US',
    type: 'HOME',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountApi.addAddressRequest).mockResolvedValue(undefined);
    vi.mocked(accountApi.updateAddressRequest).mockResolvedValue(undefined);
    vi.mocked(accountApi.deleteAddressRequest).mockResolvedValue(undefined);
    vi.mocked(accountApi.setDefaultAddressRequest).mockResolvedValue(undefined);
  });

  it.each([
    [
      'add',
      async (mutations: ReturnType<typeof useAddressMutations>) => {
        await mutations.addAddress.mutateAsync(addDto);
      },
    ],
    [
      'update',
      async (mutations: ReturnType<typeof useAddressMutations>) => {
        await mutations.updateAddress.mutateAsync({
          addressId: 9,
          dto: { city: 'Dallas' },
        });
      },
    ],
    [
      'delete',
      async (mutations: ReturnType<typeof useAddressMutations>) => {
        await mutations.deleteAddress.mutateAsync({ addressId: 9 });
      },
    ],
    [
      'set-default',
      async (mutations: ReturnType<typeof useAddressMutations>) => {
        await mutations.setDefaultAddress.mutateAsync({ addressId: 9 });
      },
    ],
  ] as const)('invalidates account me on successful %s', async (_label, run) => {
    const { Wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useAddressMutations(5), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await run(result.current);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: accountKeys.me(),
      });
    });
  });
});
