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

type CancelOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  error?: string | null;
};

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderNumber,
  onConfirm,
  isPending,
  error,
}: CancelOrderDialogProps) {
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
          <AlertDialogTitle>Cancel order?</AlertDialogTitle>
          <AlertDialogDescription>
            Cancel {orderNumber}? This cannot be undone from your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ActionErrorAlert message={error} title="Could not cancel order" />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep order</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              void onConfirm();
            }}
          >
            {isPending ? 'Cancelling…' : 'Cancel order'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
