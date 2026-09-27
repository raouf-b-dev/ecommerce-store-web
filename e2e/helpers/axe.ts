import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface CheckA11yOptions {
  include?: string[];
  exclude?: string[];
  disabledRules?: string[];
}

/**
 * Runs axe accessibility audit on the active page and asserts
 * that zero critical or serious WCAG violations exist.
 */
export async function checkA11y(
  page: Page,
  contextName: string,
  options?: CheckA11yOptions,
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ]);

  if (options?.include && options.include.length > 0) {
    for (const selector of options.include) {
      builder = builder.include(selector);
    }
  }

  if (options?.exclude && options.exclude.length > 0) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  if (options?.disabledRules && options.disabledRules.length > 0) {
    builder = builder.disableRules(options.disabledRules);
  }

  const results = await builder.analyze();

  const seriousOrCriticalViolations = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );

  if (seriousOrCriticalViolations.length > 0) {
    const formattedErrors = seriousOrCriticalViolations
      .map(
        (v) =>
          `[${v.impact?.toUpperCase()}] ${v.id}: ${v.help} (${v.helpUrl})\n` +
          v.nodes
            .map((n) => `  - Target: ${n.target.join(' ')}\n    Failure: ${n.failureSummary}`)
            .join('\n'),
      )
      .join('\n\n');

    expect(
      seriousOrCriticalViolations,
      `Accessibility violations found in ${contextName}:\n${formattedErrors}`,
    ).toEqual([]);
  }
}
