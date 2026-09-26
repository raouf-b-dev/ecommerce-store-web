// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import {
  healthLabelCopy,
  overallHealthLabel,
  type ApiHealthSnapshot,
  type ProbeOutcome,
} from '@/features/health/lib/map-api-status';

function ProbeList({ title, probe }: { title: string; probe: ProbeOutcome | null }) {
  if (!probe) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">No response.</p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground">
        HTTP {probe.httpStatus} · {probe.status}
      </p>
      {probe.indicators.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {probe.indicators.map((indicator) => (
            <li key={indicator.name}>
              {indicator.name}: {indicator.status}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function HealthStatusView({ snapshot }: { snapshot: ApiHealthSnapshot }) {
  const label = overallHealthLabel(snapshot);

  return (
    <div className="space-y-8">
      <p className="text-sm font-medium" role="status">
        {healthLabelCopy(label)}
      </p>
      <ProbeList title="Aggregate health" probe={snapshot.health} />
      <ProbeList title="Readiness" probe={snapshot.readiness} />
    </div>
  );
}
