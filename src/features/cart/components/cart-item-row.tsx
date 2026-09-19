'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActionErrorAlert } from '@/components/feedback/action-error-alert';
import { ProductImage } from '@/components/media/product-image';
import { formatMoney } from '@/lib/format';
import { getErrorMessage } from '@/lib/api/parse-api-error';
import {
  useRemoveCartItem,
  useUpdateCartItemQuantity,
} from '@/features/cart/hooks/use-cart-mutations';
import type { CartItemResponse } from '@/features/cart/types';

type CartItemRowProps = {
  item: CartItemResponse;
};

export function CartItemRow({ item }: CartItemRowProps) {
  const [actionError, setActionError] = useState<string | null>(null);

  const updateQuantityMutation = useUpdateCartItemQuantity();
  const removeMutation = useRemoveCartItem();

  const isPending =
    updateQuantityMutation.isPending || removeMutation.isPending;

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 99 || newQuantity === item.quantity) {
      return;
    }
    setActionError(null);
    try {
      await updateQuantityMutation.mutateAsync({
        itemId: item.id,
        quantity: newQuantity,
      });
    } catch (error) {
      setActionError(
        getErrorMessage(error, 'Could not update item quantity.'),
      );
    }
  };

  const handleRemove = async () => {
    setActionError(null);
    try {
      await removeMutation.mutateAsync({
        itemId: item.id,
      });
    } catch (error) {
      setActionError(
        getErrorMessage(error, 'Could not remove item from cart.'),
      );
    }
  };

  return (
    <li
      data-testid={`cart-item-${item.id}`}
      className="flex flex-col gap-4 border-b py-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted/20">
          <ProductImage
            src={item.imageUrl}
            alt={item.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="space-y-1">
          <Link
            href={`/products/${item.productId}`}
            className="text-base font-semibold text-foreground transition-colors hover:underline"
          >
            {item.productName}
          </Link>
          <p className="text-sm text-muted-foreground">
            {formatMoney(item.price, item.currency)} each
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 sm:justify-end">
        <div
          className="flex items-center rounded-lg border bg-background"
          role="group"
          aria-label={`Quantity selector for ${item.productName}`}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1 || isPending}
            aria-label={`Decrease quantity of ${item.productName}`}
            className="h-8 w-8 rounded-r-none"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span
            className="flex h-8 w-10 items-center justify-center text-xs font-semibold tabular-nums"
            aria-live="polite"
          >
            {item.quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleUpdateQuantity(item.quantity + 1)}
            disabled={item.quantity >= 99 || isPending}
            aria-label={`Increase quantity of ${item.productName}`}
            className="h-8 w-8 rounded-l-none"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="min-w-20 text-right">
          <span className="text-base font-semibold text-foreground">
            {formatMoney(item.subtotal, item.currency)}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isPending}
          aria-label={`Remove ${item.productName} from cart`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {actionError ? (
        <div className="w-full sm:col-span-2">
          <ActionErrorAlert message={actionError} title="Cart update error" />
        </div>
      ) : null}
    </li>
  );
}
