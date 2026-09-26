// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Match a class-validator / API validation line to a known form field name.
 * Longer / more specific names should be listed first when they share prefixes
 * (e.g. `street2` before `street`).
 */
export function matchField<TField extends string>(
  fields: readonly TField[],
  validationLine: string,
): TField | null {
  const lower = validationLine.toLowerCase();

  for (const field of fields) {
    if (lower.includes(field.toLowerCase())) {
      return field;
    }
  }

  for (const field of fields) {
    const propName = field.includes('.') ? field.split('.').at(-1)! : field;
    const propLower = propName.toLowerCase();
    if (
      lower.includes(` ${propLower} `) ||
      lower.startsWith(`${propLower} `) ||
      lower.endsWith(` ${propLower}`) ||
      lower.includes(`.${propLower}`)
    ) {
      return field;
    }
  }

  return null;
}
