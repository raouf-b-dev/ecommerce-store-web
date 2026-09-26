'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

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
import { formatAddressOneLine } from '@/features/account/lib/format-address';
import type { AddressResponseDto } from '@/features/account/types';

type DeleteAddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: AddressResponseDto | null;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  error?: string | null;
  onCloseAutoFocus?: (event: Event) => void;
};

export function DeleteAddressDialog({
  open,
  onOpenChange,
  address,
  onConfirm,
  isPending,
  error,
  onCloseAutoFocus,
}: DeleteAddressDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete address?</AlertDialogTitle>
          <AlertDialogDescription>
            {address
              ? `This will permanently remove ${formatAddressOneLine(address)} from your address book.`
              : 'This will permanently remove the address from your address book.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ActionErrorAlert message={error} title="Could not delete address" />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || !address}
            onClick={() => {
              void onConfirm();
            }}
          >
            {isPending ? 'Deleting…' : 'Delete address'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
