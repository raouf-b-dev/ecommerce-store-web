import { cn } from '@/lib/utils';
import { shop } from '@/lib/shop';

type ShopMarkProps = {
  className?: string;
};

/** The favicon mark, rendered decoratively next to the shop name. */
export function ShopMark({ className }: ShopMarkProps) {
  return (
    <img
      src={shop.markPath}
      alt=""
      aria-hidden="true"
      width={28}
      height={28}
      className={cn('shrink-0', className)}
    />
  );
}
