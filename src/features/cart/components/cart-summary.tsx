'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionErrorAlert } from '@/components/feedback/action-error-alert';
import { formatMoney } from '@/lib/format';
import { getErrorMessage } from '@/lib/api/parse-api-error';
import { useClearCart } from '@/features/cart/hooks/use-cart-mutations';

type CartSummaryProps = {
  subtotal: number;
  totalAmount: number;
  currency: string;
  itemCount: number;
};

export function CartSummary({
  subtotal,
  totalAmount,
  currency,
  itemCount,
}: CartSummaryProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const clearCartMutation = useClearCart();

  const handleClearCart = async () => {
    setActionError(null);
    try {
      await clearCartMutation.mutateAsync();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not clear cart.'));
    }
  };

  return (
    <Card className="rounded-xl border shadow-xs">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium text-foreground">
            {formatMoney(subtotal, currency)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-xs text-muted-foreground">
            Calculated at checkout
          </span>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-base font-bold">
            <span className="text-foreground">Estimated Total</span>
            <span className="text-foreground">
              {formatMoney(totalAmount, currency)}
            </span>
          </div>
        </div>

        <ActionErrorAlert message={actionError} title="Error" />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-2">
        <Button
          disabled
          aria-disabled="true"
          className="w-full font-medium"
          size="lg"
        >
          Proceed to Checkout
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Checkout will be enabled soon.
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearCart}
          disabled={clearCartMutation.isPending}
          className="w-full text-xs text-muted-foreground hover:text-destructive"
        >
          {clearCartMutation.isPending ? 'Clearing…' : 'Clear shopping cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
