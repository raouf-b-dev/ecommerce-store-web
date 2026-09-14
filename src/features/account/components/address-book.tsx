'use client';

import { useState } from 'react';
import {
  QueryListRegion,
  QueryStateAlert,
} from '@/components/feedback/query-state';
import { ActionErrorAlert } from '@/components/feedback/action-error-alert';
import { Button } from '@/components/ui/button';
import { AddressCard } from '@/features/account/components/address-card';
import { AddressFormDialog } from '@/features/account/components/address-form-dialog';
import { DeleteAddressDialog } from '@/features/account/components/delete-address-dialog';
import { useAddressMutations } from '@/features/account/hooks/use-address-mutations';
import { useUserProfile } from '@/features/account/hooks/use-user-profile';
import type {
  AddAddressDto,
  AddressResponseDto,
  UpdateAddressDto,
} from '@/features/account/types';
import type {
  AddAddressFormValues,
  UpdateAddressFormValues,
} from '@/features/account/schemas/address-schema';
import { getErrorMessage } from '@/lib/api/parse-api-error';

type AddressBookProps = {
  userId: number;
};

type FormMode = 'add' | 'edit';

function toAddDto(
  values: AddAddressFormValues | UpdateAddressFormValues,
): AddAddressDto {
  const street2 = values.street2?.trim();
  const deliveryInstructions = values.deliveryInstructions?.trim();
  const isDefault =
    'isDefault' in values && typeof values.isDefault === 'boolean'
      ? values.isDefault
      : undefined;

  return {
    street: values.street.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    postalCode: values.postalCode.trim(),
    country: values.country.trim().toUpperCase(),
    ...(street2 ? { street2 } : {}),
    ...(values.type ? { type: values.type } : {}),
    ...(typeof isDefault === 'boolean' ? { isDefault } : {}),
    ...(deliveryInstructions ? { deliveryInstructions } : {}),
  };
}

function toUpdateDto(values: UpdateAddressFormValues): UpdateAddressDto {
  const street2 = values.street2?.trim();
  const deliveryInstructions = values.deliveryInstructions?.trim();

  return {
    street: values.street.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    postalCode: values.postalCode.trim(),
    country: values.country.trim().toUpperCase(),
    street2: street2 || undefined,
    ...(values.type ? { type: values.type } : {}),
    deliveryInstructions: deliveryInstructions || undefined,
  };
}

export function AddressBook({ userId }: AddressBookProps) {
  const { user, isLoading, isFetching, isError, error, refetch } =
    useUserProfile(userId);
  const {
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddressMutations(userId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editingAddress, setEditingAddress] =
    useState<AddressResponseDto | null>(null);
  const [deletingAddress, setDeletingAddress] =
    useState<AddressResponseDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [setDefaultError, setSetDefaultError] = useState<string | null>(null);
  const [pendingSetDefaultId, setPendingSetDefaultId] = useState<number | null>(
    null,
  );

  const addresses = user?.addresses ?? [];
  const formPending =
    formMode === 'add' ? addAddress.isPending : updateAddress.isPending;

  function openAdd() {
    setFormMode('add');
    setEditingAddress(null);
    addAddress.reset();
    updateAddress.reset();
    setFormOpen(true);
  }

  function openEdit(address: AddressResponseDto) {
    setFormMode('edit');
    setEditingAddress(address);
    addAddress.reset();
    updateAddress.reset();
    setFormOpen(true);
  }

  function openDelete(address: AddressResponseDto) {
    setDeleteError(null);
    deleteAddress.reset();
    setDeletingAddress(address);
  }

  async function handleFormSubmit(
    values: AddAddressFormValues | UpdateAddressFormValues,
  ) {
    if (formMode === 'add') {
      await addAddress.mutateAsync(toAddDto(values));
    } else if (editingAddress) {
      await updateAddress.mutateAsync({
        addressId: editingAddress.id,
        dto: toUpdateDto(values),
      });
    }
    setFormOpen(false);
    setEditingAddress(null);
  }

  async function handleDeleteConfirm() {
    if (!deletingAddress) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteAddress.mutateAsync({ addressId: deletingAddress.id });
      setDeletingAddress(null);
    } catch (deleteErr) {
      setDeleteError(
        getErrorMessage(deleteErr, 'Could not delete address.'),
      );
    }
  }

  async function handleSetDefault(address: AddressResponseDto) {
    setSetDefaultError(null);
    setPendingSetDefaultId(address.id);
    try {
      await setDefaultAddress.mutateAsync({ addressId: address.id });
    } catch (setDefaultErr) {
      setSetDefaultError(
        getErrorMessage(setDefaultErr, 'Could not set default address.'),
      );
    } finally {
      setPendingSetDefaultId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Address book</h2>
          <p className="text-sm text-muted-foreground">
            Manage shipping and billing addresses for checkout.
          </p>
        </div>
        <Button type="button" onClick={openAdd}>
          Add address
        </Button>
      </div>

      <QueryStateAlert
        isError={isError}
        hasData={Boolean(user)}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        resource="address book"
      />

      <ActionErrorAlert
        message={setDefaultError}
        title="Could not set default address"
      />

      <QueryListRegion
        isLoading={isLoading}
        isFetching={isFetching}
        loadingLabel="Loading addresses…"
        hasData={Boolean(user)}
      >
        {addresses.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed px-4 py-10">
            <p className="text-sm text-muted-foreground">
              No addresses yet. Add one to use a saved shipping address at
              checkout.
            </p>
            <Button type="button" onClick={openAdd}>
              Add address
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2" aria-label="Saved addresses">
            {addresses.map((address) => (
              <li key={address.id}>
                <AddressCard
                  address={address}
                  onEdit={() => openEdit(address)}
                  onDelete={() => openDelete(address)}
                  onSetDefault={() => {
                    void handleSetDefault(address);
                  }}
                  setDefaultPending={
                    setDefaultAddress.isPending &&
                    pendingSetDefaultId === address.id
                  }
                  deletePending={
                    deleteAddress.isPending &&
                    deletingAddress?.id === address.id
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </QueryListRegion>

      {formOpen ? (
        <AddressFormDialog
          key={`${formMode}-${editingAddress?.id ?? 'new'}`}
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          initialAddress={editingAddress}
          onSubmit={handleFormSubmit}
          isPending={formPending}
        />
      ) : null}

      <DeleteAddressDialog
        open={Boolean(deletingAddress)}
        onOpenChange={(open) => {
          if (!open && !deleteAddress.isPending) {
            setDeletingAddress(null);
            setDeleteError(null);
          }
        }}
        address={deletingAddress}
        onConfirm={handleDeleteConfirm}
        isPending={deleteAddress.isPending}
        error={deleteError}
      />
    </section>
  );
}
