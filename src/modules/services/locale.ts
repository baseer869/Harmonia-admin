import type {
  ServiceIncluded,
  ServiceInfo,
  ServiceLocaleFields,
  ServiceTranslations,
} from './types';

/**
 * Peer-locale text resolution.
 *
 * A service stores ALL of its human text inside `translations`, keyed by locale
 * — there is no "canonical" language column. `resolveServiceText` reads the
 * requested locale first, then falls back across the other locales so a service
 * that has only French still renders for an English visitor (and vice-versa).
 */

// Fallback order consulted after the requested locale, before any remaining one.
const FALLBACK = ['fr', 'en'];

const filled = (s?: string): boolean => Boolean(s && s.trim());

/** Locales to consult in order: requested → fr → en → whatever else exists. */
function localeChain(tr: ServiceTranslations, locale?: string): string[] {
  const chain = [locale, ...FALLBACK, ...Object.keys(tr)].filter(
    (l): l is string => Boolean(l) && Boolean(tr[l as string]),
  );
  return [...new Set(chain)];
}

export interface ResolvedServiceText {
  title: string;
  subtitle: string | null;
  description: string | null;
  priceUnit: string | null;
  tags: string[];
  included: ServiceIncluded[];
  info: ServiceInfo[];
  /** Localized name for the option/extra at `index`, falling back to `base`. */
  optionName: (index: number, base: string) => string;
  extraName: (index: number, base: string) => string;
}

/** Resolve a service's display text for `locale` from its peer translations. */
export function resolveServiceText(
  translations: ServiceTranslations | null,
  locale?: string,
): ResolvedServiceText {
  const tr = translations ?? {};
  const chain = localeChain(tr, locale);

  const str = (get: (f: ServiceLocaleFields) => string | undefined): string | undefined => {
    for (const l of chain) {
      const v = get(tr[l]!);
      if (filled(v)) return v;
    }
    return undefined;
  };
  const arr = <T>(get: (f: ServiceLocaleFields) => T[] | undefined): T[] | undefined => {
    for (const l of chain) {
      const v = get(tr[l]!);
      if (Array.isArray(v) && v.length) return v;
    }
    return undefined;
  };

  return {
    title: str((f) => f.title) ?? '',
    subtitle: str((f) => f.subtitle) ?? null,
    description: str((f) => f.description) ?? null,
    priceUnit: str((f) => f.priceUnit) ?? null,
    tags: arr((f) => f.tags) ?? [],
    included: arr((f) => f.included) ?? [],
    info: arr((f) => f.info) ?? [],
    optionName: (i, base) => str((f) => f.options?.[i]?.name) ?? base,
    extraName: (i, base) => str((f) => f.extras?.[i]?.name) ?? base,
  };
}

/** Which locales are "complete" enough to publish (have a title). */
export function translationCoverage(tr: ServiceTranslations | null): string[] {
  if (!tr) return [];
  return Object.keys(tr).filter((l) => filled(tr[l]?.title));
}
