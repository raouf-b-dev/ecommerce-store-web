'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/layout/page-header';
import { QueryStateAlert } from '@/components/feedback/query-state';
import { AccountNav } from '@/features/account/components/account-nav';
import { AddressBook } from '@/features/account/components/address-book';
import { ProfileReadOnlyPanel } from '@/features/account/components/profile-read-only-panel';
import { useUserProfile } from '@/features/account/hooks/use-user-profile';
import { parseSessionUserId } from '@/features/account/lib/parse-session-user-id';
import { useAuth } from '@/lib/auth/auth-context';

export function AccountContent() {
  const { session } = useAuth();
  const userId = parseSessionUserId(session?.userId);
  const { user, isLoading, isError, error, refetch } = useUserProfile(userId);

  if (!userId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Account"
          description="View your profile and manage saved addresses."
        />
        <AccountNav />
        <Alert variant="destructive">
          <AlertTitle>Could not load account</AlertTitle>
          <AlertDescription>
            Your session is missing a valid user id. Sign out and sign in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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

      <AddressBook userId={userId} />
    </div>
  );
}
