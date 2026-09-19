'use client';

import { PageHeader } from '@/components/layout/page-header';
import { QueryStateAlert } from '@/components/feedback/query-state';
import { AccountNav } from '@/components/layout/account-nav';
import { AddressBook } from '@/features/account/components/address-book';
import { ProfileReadOnlyPanel } from '@/features/account/components/profile-read-only-panel';
import { useUserProfile } from '@/features/account/hooks/use-user-profile';

export function AccountContent() {
  const { user, isLoading, isError, error, refetch } = useUserProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account"
        description="View your profile and manage saved addresses."
      />
      <AccountNav />

      <QueryStateAlert
        isError={isError}
        hasData={Boolean(user)}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        resource="profile"
      />

      {isLoading && !user ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading profile…
        </p>
      ) : null}

      {user ? <ProfileReadOnlyPanel user={user} /> : null}

      {user ? <AddressBook userId={user.id} /> : null}
    </div>
  );
}
