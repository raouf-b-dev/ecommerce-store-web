import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QueryLoading } from '@/components/feedback/query-state';
import { PageHeader } from '@/components/layout/page-header';
import { RegisterForm } from '@/features/auth/components/register-form';
import { firstSearchValue } from '@/features/auth/lib/first-search-value';

export const metadata: Metadata = {
  title: 'Create account',
};

// GuestRoute must finish browser-only cookie bootstrap before revealing auth UI.
export const instant = false;

async function RegisterFormWithRedirect({
  searchParams,
}: Pick<PageProps<'/register'>, 'searchParams'>) {
  const params = await searchParams;
  return <RegisterForm redirect={firstSearchValue(params.redirect)} />;
}

export default function RegisterPage({
  searchParams,
}: PageProps<'/register'>) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create account"
        description="Register a customer account, then we sign you in automatically."
      />
      <Suspense
        fallback={<QueryLoading>Loading registration form…</QueryLoading>}
      >
        <RegisterFormWithRedirect searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
