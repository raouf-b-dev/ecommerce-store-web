// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
  healthLabelCopy,
  overallHealthLabel,
  parseProbeBody,
} from '@/features/health/lib/map-api-status';

describe('parseProbeBody', () => {
  it('reads terminus status and indicator details', () => {
    expect(
      parseProbeBody(
        {
          status: 'ok',
          details: {
            postgres: { status: 'up' },
            redis: { status: 'up' },
          },
        },
        200,
      ),
    ).toEqual({
      httpStatus: 200,
      status: 'ok',
      indicators: [
        { name: 'postgres', status: 'up' },
        { name: 'redis', status: 'up' },
      ],
    });
  });

  it('falls back when the body is not an object', () => {
    expect(parseProbeBody(null, 503)).toEqual({
      httpStatus: 503,
      status: 'error',
      indicators: [],
    });
  });
});

describe('overallHealthLabel', () => {
  it('is down when the API is unreachable', () => {
    expect(
      overallHealthLabel({
        reachable: false,
        health: null,
        readiness: null,
      }),
    ).toBe('down');
    expect(healthLabelCopy('down')).toBe('API is down');
  });

  it('is up when health and readiness succeed', () => {
    expect(
      overallHealthLabel({
        reachable: true,
        health: { httpStatus: 200, status: 'ok', indicators: [] },
        readiness: { httpStatus: 200, status: 'ok', indicators: [] },
      }),
    ).toBe('up');
  });

  it('is degraded when readiness is ok but aggregate health is not', () => {
    expect(
      overallHealthLabel({
        reachable: true,
        health: { httpStatus: 503, status: 'error', indicators: [] },
        readiness: { httpStatus: 200, status: 'ok', indicators: [] },
      }),
    ).toBe('degraded');
  });
});
