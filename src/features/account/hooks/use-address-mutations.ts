'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addAddressRequest,
  deleteAddressRequest,
  setDefaultAddressRequest,
  updateAddressRequest,
} from '@/features/account/api/account-api';
import { accountKeys } from '@/features/account/hooks/account-keys';
import type {
  AddAddressDto,
  UpdateAddressDto,
} from '@/features/account/types';

export type AddressMutationControls<TVariables> = {
  mutateAsync: (variables: TVariables) => Promise<void>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
};

export type UseAddressMutationsResult = {
  addAddress: AddressMutationControls<AddAddressDto>;
  updateAddress: AddressMutationControls<{
    addressId: number;
    dto: UpdateAddressDto;
  }>;
  deleteAddress: AddressMutationControls<{ addressId: number }>;
  setDefaultAddress: AddressMutationControls<{ addressId: number }>;
};

function toControls<TVariables>(mutation: {
  mutateAsync: (variables: TVariables) => Promise<void>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}): AddressMutationControls<TVariables> {
  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useAddressMutations(
  userId: number | undefined,
): UseAddressMutationsResult {
  const queryClient = useQueryClient();

  const invalidateProfile = async () => {
    if (typeof userId === 'number' && userId > 0) {
      await queryClient.invalidateQueries({
        queryKey: accountKeys.detail(userId),
      });
    }
  };

  const addAddress = useMutation({
    mutationFn: async (dto: AddAddressDto) => {
      if (typeof userId !== 'number' || userId <= 0) {
        throw new Error('Missing user id for address mutation.');
      }
      await addAddressRequest(userId, dto);
    },
    onSuccess: invalidateProfile,
  });

  const updateAddress = useMutation({
    mutationFn: async ({
      addressId,
      dto,
    }: {
      addressId: number;
      dto: UpdateAddressDto;
    }) => {
      if (typeof userId !== 'number' || userId <= 0) {
        throw new Error('Missing user id for address mutation.');
      }
      await updateAddressRequest(userId, addressId, dto);
    },
    onSuccess: invalidateProfile,
  });

  const deleteAddress = useMutation({
    mutationFn: async ({ addressId }: { addressId: number }) => {
      if (typeof userId !== 'number' || userId <= 0) {
        throw new Error('Missing user id for address mutation.');
      }
      await deleteAddressRequest(userId, addressId);
    },
    onSuccess: invalidateProfile,
  });

  const setDefaultAddress = useMutation({
    mutationFn: async ({ addressId }: { addressId: number }) => {
      if (typeof userId !== 'number' || userId <= 0) {
        throw new Error('Missing user id for address mutation.');
      }
      await setDefaultAddressRequest(userId, addressId);
    },
    onSuccess: invalidateProfile,
  });

  return {
    addAddress: toControls(addAddress),
    updateAddress: toControls(updateAddress),
    deleteAddress: toControls(deleteAddress),
    setDefaultAddress: toControls(setDefaultAddress),
  };
}
