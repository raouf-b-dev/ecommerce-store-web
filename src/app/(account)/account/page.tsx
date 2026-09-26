// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { Metadata } from 'next';
import { AccountContent } from '@/features/account/components/account-content';

export const metadata: Metadata = {
  title: 'Account',
};

// ProtectedRoute must finish browser-only cookie bootstrap before account UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

export default function AccountPage() {
  return <AccountContent />;
}
