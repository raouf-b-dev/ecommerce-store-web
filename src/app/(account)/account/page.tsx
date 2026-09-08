import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { AccountSessionSummary } from '@/features/auth/components/account-session-summary';

export const metadata: Metadata = {
  title: 'Account',
};

// ProtectedRoute must finish browser-only cookie bootstrap before account UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Account"
        description="You are signed in. Profile and address book will land in a later delivery."
      />
      <AccountSessionSummary />
    </div>
  );
}
