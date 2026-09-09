import { Button } from '@/components/ui/button';

export function AddToCartCta() {
  return (
    <div className="w-full">
      <Button
        disabled
        aria-disabled="true"
        aria-describedby="add-to-cart-hint"
        className="w-full"
        size="lg"
      >
        Add to cart
      </Button>
      <p
        id="add-to-cart-hint"
        className="mt-2 text-center text-xs text-muted-foreground"
      >
        Ordering will be enabled soon.
      </p>
    </div>
  );
}
