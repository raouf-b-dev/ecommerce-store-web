'use client';

import { Button } from '@/components/ui/button';
import {
  DEMO_CUSTOMER_EMAIL,
  DEMO_CUSTOMER_PASSWORD,
} from '@/lib/mock/constants';

type DemoLoginActionsProps = {
  /** Receives the demo credentials; the form fills them in and signs in. */
  onSelect: (credentials: { email: string; password: string }) => void;
  disabled?: boolean;
};

export default function DemoLoginActions({
  onSelect,
  disabled,
}: DemoLoginActionsProps) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-sm">
      <p className="mb-3 text-muted-foreground">
        This is a demo store. Sign in as the demo shopper to try the cart and
        checkout.
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() =>
          onSelect({
            email: DEMO_CUSTOMER_EMAIL,
            password: DEMO_CUSTOMER_PASSWORD,
          })
        }
      >
        Sign in as demo shopper
      </Button>
    </div>
  );
}
