export function matchAuthField<TField extends string>(
  fields: readonly TField[],
  validationLine: string,
): TField | null {
  const lower = validationLine.toLowerCase();
  for (const field of fields) {
    if (lower.includes(field.toLowerCase())) {
      return field;
    }
  }
  return null;
}
