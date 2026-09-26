// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  children,
  className,
  'data-testid': dataTestId,
}: EmptyStateProps) {
  const rootClassName = [
    'flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-10 text-center',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-testid={dataTestId} className={rootClassName}>
      {icon ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
