'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatAddressLines } from '@/features/account/lib/format-address';
import type { AddressResponseDto } from '@/features/account/types';

type AddressCardProps = {
  address: AddressResponseDto;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  setDefaultPending?: boolean;
  deletePending?: boolean;
};

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  setDefaultPending = false,
  deletePending = false,
}: AddressCardProps) {
  const lines = formatAddressLines(address);
  const actionsDisabled = setDefaultPending || deletePending;

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {address.type}
          </span>
          {address.isDefault ? (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Default
            </span>
          ) : null}
          <CardTitle className="sr-only">
            {address.isDefault ? 'Default address' : 'Address'} ({address.type})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <address className="not-italic text-sm leading-6 text-foreground">
          {lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </address>
        {address.deliveryInstructions?.trim() ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Instructions: </span>
            {address.deliveryInstructions.trim()}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={actionsDisabled}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={actionsDisabled}
        >
          {deletePending ? 'Deleting…' : 'Delete'}
        </Button>
        {!address.isDefault ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSetDefault}
            disabled={actionsDisabled}
          >
            {setDefaultPending ? 'Setting default…' : 'Set as default'}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
