// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import 'server-only';

import { serverClient } from '@/lib/api/server-client';
import {
  parseProbeBody,
  type ApiHealthSnapshot,
  type ProbeOutcome,
} from '@/features/health/lib/map-api-status';

const HEALTH_TIMEOUT_MS = 3000;

async function fetchProbe(
  path: '/health' | '/health/readiness',
): Promise<ProbeOutcome | 'unreachable'> {
  try {
    const { data, error, response } = await serverClient.GET(path, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    const body: unknown = data ?? error;
    return parseProbeBody(body, response.status);
  } catch {
    return 'unreachable';
  }
}

export async function getApiHealthSnapshot(): Promise<ApiHealthSnapshot> {
  const [health, readiness] = await Promise.all([
    fetchProbe('/health'),
    fetchProbe('/health/readiness'),
  ]);

  if (health === 'unreachable' && readiness === 'unreachable') {
    return { reachable: false, health: null, readiness: null };
  }

  return {
    reachable: true,
    health: health === 'unreachable' ? null : health,
    readiness: readiness === 'unreachable' ? null : readiness,
  };
}
