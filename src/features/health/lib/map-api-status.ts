export type HealthIndicator = {
  name: string;
  status: string;
};

export type ProbeOutcome = {
  httpStatus: number;
  status: string;
  indicators: HealthIndicator[];
};

export type ApiHealthSnapshot = {
  reachable: boolean;
  health: ProbeOutcome | null;
  readiness: ProbeOutcome | null;
};

export type ApiHealthLabel = 'up' | 'degraded' | 'down';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseProbeBody(
  body: unknown,
  httpStatus: number,
): ProbeOutcome {
  if (!isRecord(body)) {
    return {
      httpStatus,
      status: httpStatus >= 200 && httpStatus < 300 ? 'ok' : 'error',
      indicators: [],
    };
  }

  const status = typeof body.status === 'string' ? body.status : 'unknown';
  const details = isRecord(body.details) ? body.details : {};
  const indicators: HealthIndicator[] = Object.entries(details).flatMap(
    ([name, value]) => {
      if (!isRecord(value) || typeof value.status !== 'string') {
        return [];
      }
      return [{ name, status: value.status }];
    },
  );

  return { httpStatus, status, indicators };
}

export function overallHealthLabel(snapshot: ApiHealthSnapshot): ApiHealthLabel {
  if (!snapshot.reachable || !snapshot.readiness) {
    return 'down';
  }
  if (snapshot.readiness.httpStatus >= 500) {
    return 'down';
  }
  if (!snapshot.health || snapshot.health.httpStatus >= 500) {
    return 'degraded';
  }
  return 'up';
}

export function healthLabelCopy(label: ApiHealthLabel): string {
  if (label === 'up') {
    return 'API is up';
  }
  if (label === 'degraded') {
    return 'API is degraded';
  }
  return 'API is down';
}
