'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ActionErrorAlert } from '@/components/feedback/action-error-alert';
import { useAuth } from '@/lib/auth/auth-context';
import { getLoginRedirectPath } from '@/features/auth/lib/auth-routes';
import { getErrorMessage } from '@/lib/api/parse-api-error';
import { useAddToCart } from '@/features/cart/hooks/use-cart-mutations';

export type AddToCartCtaProps = {
  productId: number;
  productName: string;
  isAvailable?: boolean;
  availableQuantity?: number | null;
};

export function AddToCartCta({
  productId,
  productName,
  isAvailable = true,
  availableQuantity = null,
}: AddToCartCtaProps) {
  const [quantity, setQuantity] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const addToCartMutation = useAddToCart();

  const maxQuantity =
    typeof availableQuantity === 'number' && availableQuantity > 0
      ? Math.min(availableQuantity, 99)
      : 99;

  const isOutOfStock =
    !isAvailable || (availableQuantity !== null && availableQuantity <= 0);

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(maxQuantity, prev + 1));
  };

  const handleAddToCart = async () => {
    setActionError(null);

    if (!isAuthenticated) {
      const loginUrl = getLoginRedirectPath(pathname);
      router.push(loginUrl);
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId,
        quantity,
      });
      toast.success(
        quantity === 1
          ? `Added "${productName}" to cart`
          : `Added ${quantity} × "${productName}" to cart`,
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Could not add this item to your cart. Please try again.',
      );
      setActionError(message);
    }
  };

  if (isOutOfStock) {
    return (
      <div className="w-full space-y-2">
        <Button
          disabled
          aria-disabled="true"
          className="w-full"
          size="lg"
          variant="secondary"
        >
          Out of stock
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          This item is currently unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center rounded-lg border bg-background"
          role="group"
          aria-label="Quantity selector"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDecrement}
            disabled={quantity <= 1 || addToCartMutation.isPending}
            aria-label="Decrease quantity"
            className="h-10 w-10 rounded-r-none"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span
            className="flex h-10 w-12 items-center justify-center text-sm font-semibold tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleIncrement}
            disabled={quantity >= maxQuantity || addToCartMutation.isPending}
            aria-label="Increase quantity"
            className="h-10 w-10 rounded-l-none"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          size="lg"
          className="flex-1 gap-2 font-medium"
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
          aria-busy={addToCartMutation.isPending}
        >
          <ShoppingBag className="h-4 w-4" />
          {addToCartMutation.isPending ? 'Adding to cart…' : 'Add to cart'}
        </Button>
      </div>

      <ActionErrorAlert message={actionError} title="Unable to add item" />
    </div>
  );
}
