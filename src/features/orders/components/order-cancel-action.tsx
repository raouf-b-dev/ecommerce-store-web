'use client';

import { useState } from 'react';
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

  function openDialog() {
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
      setErrorMessage(getCancelOrderErrorMessage(error));
      if (hasHttpStatus(error, 409)) {
        setDialogOpen(false);
      }
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
      />
    </div>
  );
}
