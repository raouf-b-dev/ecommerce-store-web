'use client';

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
};

export function DeleteAddressDialog({
  open,
  onOpenChange,
  address,
  onConfirm,
  isPending,
  error,
}: DeleteAddressDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
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
