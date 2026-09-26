'use client';
// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { UserDetailResponseDto } from '@/features/account/types';
import { formatDateTime } from '@/lib/format';

type ProfileReadOnlyPanelProps = {
  user: UserDetailResponseDto;
};

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function ProfileReadOnlyPanel({ user }: ProfileReadOnlyPanelProps) {
  const phone = user.phone?.trim() ? user.phone : '—';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Profile editing is not available through this storefront — the contract
          does not expose self-update for shoppers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="First name" value={user.firstName} />
          <ProfileField label="Last name" value={user.lastName} />
          <ProfileField label="Email" value={user.email} />
          <ProfileField label="Phone" value={phone} />
          <ProfileField
            label="Member since"
            value={formatDateTime(user.createdAt)}
          />
        </dl>
      </CardContent>
    </Card>
  );
}
