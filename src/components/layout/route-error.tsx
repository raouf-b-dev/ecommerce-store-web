'use client';

import { Button } from '@/components/ui/button';

type RouteErrorProps = {
  reset: () => void;
};

export function RouteError({ reset }: RouteErrorProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        The page could not be loaded. You can try again.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
