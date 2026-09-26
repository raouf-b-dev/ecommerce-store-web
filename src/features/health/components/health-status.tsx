// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { getApiHealthSnapshot } from '@/features/health/api/get-health';
import { HealthStatusView } from '@/features/health/components/health-status-view';

export async function HealthStatus() {
  const snapshot = await getApiHealthSnapshot();
  return <HealthStatusView snapshot={snapshot} />;
}
