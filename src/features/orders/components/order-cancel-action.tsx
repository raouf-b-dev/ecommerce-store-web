'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CancelOrderDialog } from '@/features/orders/components/cancel-order-dialog';
import { useCancelOrder } from '@/features/orders/hooks/use-cancel-order';
import { getCancelOrderErrorMessage } from '@/features/orders/lib/cancel-order-error';
import { hasHttpStatus } from '@/lib/api/parse-api-error';

type OrderCancelActionProps = {
  orderId: number;
  orderNumber: string;
};

export function OrderCancelAction({
  orderId,
  orderNumber,
}: OrderCancelActionProps) {
  const cancelOrder = useCancelOrder();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleCloseAutoFocus = (event: Event) => {
    event.preventDefault();
    triggerRef.current?.focus();
  };

  function openDialog(e: React.MouseEvent<HTMLButtonElement>) {
    triggerRef.current = e.currentTarget;
    setErrorMessage(null);
    cancelOrder.reset();
    setDialogOpen(true);
  }

  async function handleConfirm() {
    setErrorMessage(null);
    try {
      await cancelOrder.mutateAsync(orderId);
      setDialogOpen(false);
      toast.success('Order cancelled');
    } catch (error) {
      const message = getCancelOrderErrorMessage(error);
      if (hasHttpStatus(error, 409)) {
        setDialogOpen(false);
        toast.error(message);
        return;
      }
      setErrorMessage(message);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="destructive"
        disabled={cancelOrder.isPending}
        onClick={openDialog}
      >
        Cancel order
      </Button>

      <CancelOrderDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && cancelOrder.isPending) {
            return;
          }
          if (!open) {
            setErrorMessage(null);
            cancelOrder.reset();
          }
          setDialogOpen(open);
        }}
        orderNumber={orderNumber}
        onConfirm={handleConfirm}
        isPending={cancelOrder.isPending}
        error={errorMessage}
        onCloseAutoFocus={handleCloseAutoFocus}
      />
    </div>
  );
}
