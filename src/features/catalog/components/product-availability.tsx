import { cn } from '@/lib/utils';
import type { ProductInventory } from '@/features/catalog/types';

type ProductAvailabilityProps = {
  inventory: ProductInventory | null;
  className?: string;
};

export function ProductAvailability({
  inventory,
  className,
}: ProductAvailabilityProps) {
  const isAvailable = Boolean(inventory && inventory.availableQuantity > 0);
  const count = inventory?.availableQuantity ?? 0;

  if (!isAvailable) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive',
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        Out of stock
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      In stock ({count} available)
    </div>
  );
}
