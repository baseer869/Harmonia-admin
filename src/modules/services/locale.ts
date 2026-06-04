import type { Service } from './types';

/** Use the override when it has content, else fall back to the default. */
const or = (override: string | undefined, fallback: string): string =>
  override && override.trim() ? override : fallback;

/**
 * Overlay a service's per-locale text overrides onto its default fields.
 * Missing translations fall back to the default language. Arrays (options,
 * extras, included, info) are matched by index against the default list, so
 * prices/structure always come from the default and only the text is swapped.
 */
export function resolveServiceLocale(s: Service, locale: string): Service {
  const tr = s.translations?.[locale];
  if (!tr) return s;
  return {
    ...s,
    title: or(tr.title, s.title),
    subtitle: or(tr.subtitle, s.subtitle ?? '') || s.subtitle,
    description: or(tr.description, s.description ?? '') || s.description,
    priceUnit: or(tr.priceUnit, s.priceUnit ?? '') || s.priceUnit,
    tags: tr.tags && tr.tags.length ? tr.tags : s.tags,
    options: s.options.map((o, i) => ({ ...o, name: or(tr.options?.[i]?.name, o.name) })),
    extras: s.extras.map((e, i) => ({ ...e, name: or(tr.extras?.[i]?.name, e.name) })),
    included: s.included.map((inc, i) => ({
      title: or(tr.included?.[i]?.title, inc.title),
      description: or(tr.included?.[i]?.description, inc.description),
    })),
    info: s.info.map((it, i) => ({
      label: or(tr.info?.[i]?.label, it.label),
      value: or(tr.info?.[i]?.value, it.value),
    })),
  };
}
