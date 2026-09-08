import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QueryLoading } from '@/components/feedback/query-state';
import { PageHeader } from '@/components/layout/page-header';
import { LoginForm } from '@/features/auth/components/login-form';
import { firstSearchValue } from '@/features/auth/lib/first-search-value';
import { GuestRoute } from '@/lib/auth/guest-route';

export const metadata: Metadata = {
  title: 'Sign in',
};

// GuestRoute must finish browser-only cookie bootstrap before revealing auth UI.
export const instant = false;

async function LoginFormWithRedirect({
  searchParams,
}: Pick<PageProps<'/login'>, 'searchParams'>) {
  const params = await searchParams;
  return <LoginForm redirect={firstSearchValue(params.redirect)} />;
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={<QueryLoading>Loading session…</QueryLoading>}>
      <GuestRoute>
        <div className="space-y-6">
          <PageHeader
            title="Sign in"
            description="Use your storefront account. A short-lived access token stays in memory; the API refresh cookie keeps you signed in."
          />
        <LoginFormWithRedirect searchParams={searchParams} />
        </div>
      </GuestRoute>
    </Suspense>
  );
}
