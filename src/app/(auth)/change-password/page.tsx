import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QueryLoading } from '@/components/feedback/query-state';
import { PageHeader } from '@/components/layout/page-header';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { firstSearchValue } from '@/lib/search-params/first-search-value';
import { ChangePasswordRoute } from '@/lib/auth/password-change-routes';

export const metadata: Metadata = {
  title: 'Change your password',
};

// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

async function ChangePasswordFormWithRedirect({
  searchParams,
}: Pick<PageProps<'/change-password'>, 'searchParams'>) {
  const params = await searchParams;
  return (
    <ChangePasswordForm redirect={firstSearchValue(params.redirect)} />
  );
}

export default function ChangePasswordPage({
  searchParams,
}: PageProps<'/change-password'>) {
  return (
    <Suspense fallback={<QueryLoading>Loading session…</QueryLoading>}>
      <ChangePasswordRoute>
        <div className="space-y-6">
          <PageHeader
            title="Change your password"
            description="Choose a new password before continuing to the storefront."
          />
          <ChangePasswordFormWithRedirect searchParams={searchParams} />
        </div>
      </ChangePasswordRoute>
    </Suspense>
  );
}
