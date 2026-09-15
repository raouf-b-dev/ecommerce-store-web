import { matchField } from '@/lib/forms/match-field';

export function matchAuthField<TField extends string>(
  fields: readonly TField[],
  validationLine: string,
): TField | null {
  return matchField(fields, validationLine);
}
