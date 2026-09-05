/** Singular, dual, and plural forms for Arabic counted nouns. */
export interface ArabicNounForms {
  singular: string;
  dual: string;
  plural: string;
}

/**
 * Returns the grammatically correct Arabic noun form for a given count.
 * Rules: 0 → plural, 1 → singular, 2 → dual, 3–10 → plural, 11+ → singular.
 */
export function getArabicCountedNoun(count: number, forms: ArabicNounForms): string {
  const n = Math.abs(Math.trunc(count));
  if (n === 0) {
    return forms.plural;
  }
  if (n === 1) {
    return forms.singular;
  }
  if (n === 2) {
    return forms.dual;
  }
  if (n >= 3 && n <= 10) {
    return forms.plural;
  }
  return forms.singular;
}

/** Formats a number with its grammatically correct Arabic noun, e.g. "10 ساعات". */
export function formatArabicCount(count: number, forms: ArabicNounForms): string {
  return `${count} ${getArabicCountedNoun(count, forms)}`;
}

/** Reusable time/duration unit forms for Arabic UI copy. */
export const ARABIC_TIME_UNIT_FORMS = {
  minute: { singular: 'دقيقة', dual: 'دقيقتين', plural: 'دقائق' },
  hour: { singular: 'ساعة', dual: 'ساعتين', plural: 'ساعات' },
  day: { singular: 'يوم', dual: 'يومين', plural: 'أيام' },
  week: { singular: 'أسبوع', dual: 'أسبوعين', plural: 'أسابيع' },
  month: { singular: 'شهر', dual: 'شهرين', plural: 'أشهر' },
  year: { singular: 'سنة', dual: 'سنتين', plural: 'سنوات' },
} as const satisfies Record<string, ArabicNounForms>;
