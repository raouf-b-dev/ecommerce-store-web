'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { Button } from '@/components/ui/button';
import {
  DEMO_CUSTOMER_EMAIL,
  DEMO_CUSTOMER_PASSWORD,
} from '@/lib/mock/constants';

type DemoLoginActionsProps = {
  onSelect: (credentials: { email: string; password: string }) => void;
};

export default function DemoLoginActions({ onSelect }: DemoLoginActionsProps) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-sm">
      <p className="mb-3 text-muted-foreground">
        Mock preview mode: use the demo customer account (no API required).
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          onSelect({
            email: DEMO_CUSTOMER_EMAIL,
            password: DEMO_CUSTOMER_PASSWORD,
          })
        }
      >
        Fill demo customer credentials
      </Button>
    </div>
  );
}
