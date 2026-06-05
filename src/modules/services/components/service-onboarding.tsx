'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Languages, Plus, Trash2 } from 'lucide-react';

import { Button, Input, Switch } from '@/components/ui';
import {
  Field,
  FieldSelect,
  ImageUpload,
  Wizard,
  type WizardStep,
} from '@/components/forms';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  fromMinorUnits,
  toMinorUnits,
} from '@/constants';
import { cn } from '@/lib/utils';
import { http } from '@/lib/api';
import { useTenants } from '@/modules/tenants';
import { useCategories } from '@/modules/categories';
import { useAdminI18n } from '@/lib/i18n/provider';
import { useCreateService, useUpdateService } from '../hooks';
import type { Service, ServiceLocaleFields } from '../types';

/** Two supported content locales — peers, neither is canonical. */
const LOCALES = ['fr', 'en'] as const;
type Locale = (typeof LOCALES)[number];

/** Per-locale text block (everything customer-facing is translated). */
const blockSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  priceUnit: z.string(),
  tagsText: z.string(),
  options: z.array(z.object({ name: z.string() })),
  extras: z.array(z.object({ name: z.string() })),
  included: z.array(z.object({ title: z.string(), description: z.string() })),
  info: z.array(z.object({ label: z.string(), value: z.string() })),
});
type Block = z.infer<typeof blockSchema>;

const emptyBlock = (): Block => ({
  title: '',
  subtitle: '',
  description: '',
  priceUnit: '',
  tagsText: '',
  options: [],
  extras: [],
  included: [],
  info: [],
});

const blockComplete = (b: Block) =>
  b.title.trim().length >= 2 && b.description.trim().length >= 1;

const schema = z
  .object({
    tenantId: z.string().min(1, 'Select a tenant'),
    categoryId: z.string().optional(),
    type: z.enum(['EXPERIENCE', 'TRANSFER', 'PRODUCT', 'QUOTE']),
    coverUrl: z.string().optional(),
    thumbUrl: z.string().optional(),
    priceMode: z.enum(['PER_PERSON', 'PER_TRIP', 'FIXED', 'ON_QUOTE']),
    price: z.coerce.number().min(0),
    currency: z.string().length(3),
    acceptedCurrencies: z.array(z.string()).default([]),
    requiresDate: z.boolean(),
    maxPeople: z.coerce.number().int().min(1).optional().or(z.literal('')),
    durationMinutes: z.coerce.number().int().min(0).optional().or(z.literal('')),
    languagesText: z.string().optional(),
    active: z.boolean(),
    featured: z.boolean(),
    // Shared structure: prices live here (language-neutral); names per locale.
    optionPrices: z.array(z.object({ priceDelta: z.coerce.number() })),
    extraPrices: z.array(z.object({ price: z.coerce.number() })),
    fr: blockSchema,
    en: blockSchema,
  })
  .superRefine((v, ctx) => {
    if (!blockComplete(v.fr) && !blockComplete(v.en)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fr', 'title'],
        message: 'Complete at least one language (title + description).',
      });
    }
  });
type Form = z.infer<typeof schema>;

const TYPE_DEFAULT_MODE: Record<Form['type'], Form['priceMode']> = {
  EXPERIENCE: 'PER_PERSON',
  TRANSFER: 'PER_TRIP',
  PRODUCT: 'FIXED',
  QUOTE: 'ON_QUOTE',
};

const csv = (s?: string) =>
  (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);

/** Build a form Block from a service's stored translations for one locale. */
function blockFrom(
  fields: ServiceLocaleFields | undefined,
  baseOptions: { name: string }[],
  baseExtras: { name: string }[],
): Block {
  return {
    title: fields?.title ?? '',
    subtitle: fields?.subtitle ?? '',
    description: fields?.description ?? '',
    priceUnit: fields?.priceUnit ?? '',
    tagsText: (fields?.tags ?? []).join(', '),
    options: baseOptions.map((o, i) => ({ name: fields?.options?.[i]?.name ?? o.name })),
    extras: baseExtras.map((e, i) => ({ name: fields?.extras?.[i]?.name ?? e.name })),
    included: fields?.included ?? [],
    info: fields?.info ?? [],
  };
}

/** Map an existing Service into the wizard's form values (edit mode). */
function toFormValues(s: Service): Form {
  const minor = (cents: number) => fromMinorUnits(cents, s.currency);
  const tr = s.translations ?? {};
  const baseOpts = s.options.map((o) => ({ name: o.name }));
  const baseExtras = s.extras.map((e) => ({ name: e.name }));
  return {
    tenantId: s.tenantId,
    categoryId: s.categoryId ?? '',
    type: s.type,
    coverUrl: s.coverUrl ?? '',
    thumbUrl: s.thumbUrl ?? '',
    priceMode: s.priceMode,
    price: minor(s.priceCents),
    currency: s.currency,
    acceptedCurrencies: s.acceptedCurrencies ?? [],
    requiresDate: s.requiresDate,
    maxPeople: s.maxPeople ?? '',
    durationMinutes: s.durationMinutes ?? '',
    languagesText: s.languages.join(', '),
    active: s.active,
    featured: s.featured,
    optionPrices: s.options.map((o) => ({ priceDelta: minor(o.priceDeltaCents) })),
    extraPrices: s.extras.map((e) => ({ price: minor(e.priceCents) })),
    fr: blockFrom(tr.fr, baseOpts, baseExtras),
    en: blockFrom(tr.en, baseOpts, baseExtras),
  } as Form;
}

export function ServiceOnboarding({ service }: { service?: Service }) {
  const router = useRouter();
  const { t, locale } = useAdminI18n();
  const isEdit = Boolean(service);
  // The portal's top-level language is the default language the admin writes in.
  const adminLang: Locale = locale === 'en' ? 'en' : 'fr';
  const wizardSteps: WizardStep[] = [
    { id: 'type', label: t.svcForm.stType },
    { id: 'general', label: t.svcForm.stGeneral },
    { id: 'media', label: t.svcForm.stMedia },
    { id: 'pricing', label: t.svcForm.stPricing },
    { id: 'options', label: t.svcForm.stOptions },
    { id: 'details', label: t.svcForm.stDetails },
    { id: 'review', label: t.svcForm.stReview },
  ];
  const createService = useCreateService();
  const updateService = useUpdateService(service?.id ?? '');
  const tenants = useTenants({ pageSize: 100 });
  const categories = useCategories();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // The admin writes in the portal's top-level language. Flipping the global
  // EN/FR toggle switches the content shown here too — there is no separate
  // per-service language menu. The other language is generated on save.
  const lang: Locale = adminLang;

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: service
      ? toFormValues(service)
      : {
          tenantId: '',
          type: 'EXPERIENCE',
          priceMode: 'PER_PERSON',
          price: 0,
          currency: DEFAULT_CURRENCY,
          acceptedCurrencies: [DEFAULT_CURRENCY],
          requiresDate: true,
          active: true,
          featured: false,
          optionPrices: [],
          extraPrices: [],
          fr: emptyBlock(),
          en: emptyBlock(),
        },
  });
  const { register, control, trigger, getValues, setValue, watch, setError, clearErrors, formState } = form;
  const { errors } = formState;

  const optionsFA = useFieldArray({ control, name: 'optionPrices' });
  const extrasFA = useFieldArray({ control, name: 'extraPrices' });
  const includedFA = useFieldArray({ control, name: 'included' as never });
  const infoFA = useFieldArray({ control, name: 'info' as never });

  const type = watch('type');
  const isProduct = type === 'PRODUCT';
  const isQuote = type === 'QUOTE';

  const otherLang: Locale = lang === 'fr' ? 'en' : 'fr';
  const langLabel = (l: Locale) => (l === 'fr' ? t.svcForm.langFr : t.svcForm.langEn);

  // Keep the en/fr arrays index-aligned when adding/removing structural rows.
  const spliceLocale = (key: 'options' | 'extras' | 'included' | 'info', i: number) => {
    LOCALES.forEach((l) => {
      const arr = ((getValues(`${l}.${key}`) as unknown[]) ?? []).slice();
      arr.splice(i, 1);
      setValue(`${l}.${key}` as never, arr as never);
    });
  };
  const addOption = () => optionsFA.append({ priceDelta: 0 });
  const removeOption = (i: number) => { optionsFA.remove(i); spliceLocale('options', i); };
  const addExtra = () => extrasFA.append({ price: 0 });
  const removeExtra = (i: number) => { extrasFA.remove(i); spliceLocale('extras', i); };
  const addIncluded = () => includedFA.append({} as never);
  const removeIncluded = (i: number) => { includedFA.remove(i); spliceLocale('included', i); };
  const addInfo = () => infoFA.append({} as never);
  const removeInfo = (i: number) => { infoFA.remove(i); spliceLocale('info', i); };

  const next = async () => {
    if (step === 0 && !(await trigger(['tenantId']))) return;
    if (step === 1) {
      // Gate the General step on the language currently being edited.
      const title = (getValues(`${lang}.title`) || '').trim();
      const description = (getValues(`${lang}.description`) || '').trim();
      if (title.length < 2 || description.length < 1) {
        setError(`${lang}.title` as never, { message: t.svcForm.reqOneLang });
        return;
      }
      clearErrors(`${lang}.title` as never);
    }
    if (step === 3 && !isQuote && !(await trigger(['price', 'currency']))) return;
    setStep((s) => Math.min(s + 1, wizardSteps.length - 1));
  };

  // Silently generate the OTHER language from the one the admin wrote in. Runs
  // on save — the admin never sees or manages this. On failure we copy the
  // source text across so both locales still exist (admin can fix later).
  const translateBlock = async (src: Block, to: Locale): Promise<Block> => {
    const out: Block = {
      title: '',
      subtitle: '',
      description: '',
      priceUnit: '',
      tagsText: '',
      options: src.options.map(() => ({ name: '' })),
      extras: src.extras.map(() => ({ name: '' })),
      included: src.included.map(() => ({ title: '', description: '' })),
      info: src.info.map(() => ({ label: '', value: '' })),
    };
    const texts: string[] = [];
    const apply: ((s: string) => void)[] = [];
    const q = (text: string | undefined, set: (s: string) => void) => {
      if (text && text.trim()) {
        texts.push(text);
        apply.push(set);
      }
    };
    q(src.title, (s) => { out.title = s; });
    q(src.subtitle, (s) => { out.subtitle = s; });
    q(src.description, (s) => { out.description = s; });
    q(src.priceUnit, (s) => { out.priceUnit = s; });
    q(src.tagsText, (s) => { out.tagsText = s; });
    src.options.forEach((o, i) => { const r = out.options[i]!; q(o.name, (s) => { r.name = s; }); });
    src.extras.forEach((e, i) => { const r = out.extras[i]!; q(e.name, (s) => { r.name = s; }); });
    src.included.forEach((it, i) => {
      const r = out.included[i]!;
      q(it.title, (s) => { r.title = s; });
      q(it.description, (s) => { r.description = s; });
    });
    src.info.forEach((it, i) => {
      const r = out.info[i]!;
      q(it.label, (s) => { r.label = s; });
      q(it.value, (s) => { r.value = s; });
    });
    if (!texts.length) return out;
    try {
      const { translations } = await http.post<{ translations: string[] }>(
        '/api/admin/translate',
        { texts, to },
      );
      apply.forEach((set, i) => set(translations[i] ?? texts[i]!));
    } catch {
      apply.forEach((set, i) => set(texts[i]!)); // fall back to the source text
    }
    return out;
  };

  const buildBlock = (b: Block, optIdx: number[], extIdx: number[]): ServiceLocaleFields => ({
    title: b.title.trim(),
    subtitle: b.subtitle.trim() || undefined,
    description: b.description.trim() || undefined,
    priceUnit: b.priceUnit.trim() || undefined,
    tags: csv(b.tagsText),
    options: optIdx.map((i) => ({ name: (b.options?.[i]?.name ?? '').trim() })),
    extras: extIdx.map((i) => ({ name: (b.extras?.[i]?.name ?? '').trim() })),
    included: (b.included ?? [])
      .map((x) => ({ title: (x.title ?? '').trim(), description: (x.description ?? '').trim() }))
      .filter((x) => x.title),
    info: (b.info ?? [])
      .map((x) => ({ label: (x.label ?? '').trim(), value: (x.value ?? '').trim() }))
      .filter((x) => x.label),
  });

  const submit = async () => {
    if (!(await trigger())) {
      if (errors[lang]) setStep(1);
      return;
    }
    setSubmitting(true);
    const v = getValues();
    // Source = the language the admin actually wrote in (prefer the selected one,
    // but fall back to the other if the selection was left empty).
    const source: Locale = blockComplete(v[lang]) ? lang : blockComplete(v[otherLang]) ? otherLang : lang;
    const target: Locale = source === 'fr' ? 'en' : 'fr';
    const src = v[source];
    // Generate the other language silently from the source.
    const generated = await translateBlock(src, target);

    // Option/extra rows are kept only when the written language names them.
    const optIdx = v.optionPrices
      .map((_, i) => i)
      .filter((i) => (src.options?.[i]?.name ?? '').trim());
    const extIdx = v.extraPrices
      .map((_, i) => i)
      .filter((i) => (src.extras?.[i]?.name ?? '').trim());

    const translations: Record<string, ServiceLocaleFields> = {
      [source]: buildBlock(src, optIdx, extIdx),
      [target]: buildBlock(generated, optIdx, extIdx),
    };

    const payload = {
      categoryId: v.categoryId || undefined,
      type: v.type,
      coverUrl: v.coverUrl || '',
      thumbUrl: v.thumbUrl || '',
      priceMode: v.priceMode,
      priceCents: isQuote ? 0 : toMinorUnits(Number(v.price), v.currency),
      currency: v.currency,
      acceptedCurrencies: Array.from(new Set([v.currency, ...v.acceptedCurrencies])),
      requiresDate: isProduct ? false : v.requiresDate,
      maxPeople: v.maxPeople ? Number(v.maxPeople) : undefined,
      durationMinutes: v.durationMinutes ? Number(v.durationMinutes) : undefined,
      languages: csv(v.languagesText),
      active: v.active,
      featured: v.featured,
      options: optIdx.map((i) => ({
        name: (src.options?.[i]?.name ?? '').trim(),
        priceDeltaCents: toMinorUnits(Number(v.optionPrices[i]?.priceDelta) || 0, v.currency),
      })),
      extras: extIdx.map((i) => ({
        name: (src.extras?.[i]?.name ?? '').trim(),
        priceCents: toMinorUnits(Number(v.extraPrices[i]?.price) || 0, v.currency),
      })),
      translations,
    };
    try {
      if (isEdit) {
        await updateService.mutateAsync(payload);
      } else {
        await createService.mutateAsync({ ...payload, tenantId: v.tenantId });
      }
      router.push('/services');
      router.refresh();
    } catch (err) {
      setError('root', { message: (err as Error).message });
      setStep(wizardSteps.length - 1);
    } finally {
      setSubmitting(false);
    }
  };

  const cover = watch('coverUrl');
  const thumb = watch('thumbUrl');

  // Read-only indicator: the content language follows the portal language (the
  // top-level EN/FR switch). The other language is generated on save.
  const langBar = (
    <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        <Languages className="size-4" /> {t.svcForm.contentLanguage}:
      </span>
      <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-medium">
        {langLabel(lang)}
      </span>
      <span className="text-muted-foreground text-xs">· {t.svcForm.autoTranslateHint}</span>
    </div>
  );

  const langErr = (path: 'title' | 'description') =>
    (errors[lang] as Record<string, { message?: string }> | undefined)?.[path]?.message;

  return (
    <Wizard
      title={isEdit ? t.svcForm.editTitle : t.svcForm.addTitle}
      backHref="/services"
      steps={wizardSteps}
      current={step}
      onStepChange={setStep}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      onSubmit={submit}
      isSubmitting={submitting}
      submitLabel={isEdit ? t.common.save : t.svcForm.create}
    >
      {step === 0 && (
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
          <Field label={t.svcForm.tenant} required error={errors.tenantId?.message}>
            <FieldSelect {...register('tenantId')} disabled={isEdit}>
              <option value="">{t.svcForm.selectTenant}</option>
              {tenants.data?.items.map((tn) => (
                <option key={tn.id} value={tn.id}>{tn.name}</option>
              ))}
            </FieldSelect>
          </Field>
          <Field label={t.svcForm.svcType} hint={t.svcForm.hintType}>
            <FieldSelect
              {...register('type')}
              onChange={(e) => {
                const ty = e.target.value as Form['type'];
                setValue('type', ty);
                setValue('priceMode', TYPE_DEFAULT_MODE[ty]);
              }}
            >
              <option value="EXPERIENCE">{t.svcForm.tExperience}</option>
              <option value="TRANSFER">{t.svcForm.tTransfer}</option>
              <option value="PRODUCT">{t.svcForm.tProduct}</option>
              <option value="QUOTE">{t.svcForm.tQuote}</option>
            </FieldSelect>
          </Field>
          <Field label={t.svcForm.category} hint={t.svcForm.optional} className="md:col-span-3">
            {(() => {
              const cats = categories.data?.items ?? [];
              const parents = cats.filter((c) => !c.parentId);
              const selected = watch('categoryId');
              const row = (id: string, label: string, indent: boolean) => (
                <button
                  key={id || 'none'}
                  type="button"
                  onClick={() => setValue('categoryId', id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[15px] transition-colors',
                    indent && 'pl-8',
                    selected === id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-accent',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-4 shrink-0 place-items-center rounded-full border',
                      selected === id ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                    )}
                  >
                    {selected === id && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                  {label}
                </button>
              );
              return (
                <div className="max-h-60 space-y-0.5 overflow-y-auto rounded-lg border p-2">
                  {row('', t.svcForm.none, false)}
                  {parents.map((p) => (
                    <div key={p.id}>
                      {row(p.id, p.name, false)}
                      {cats
                        .filter((c) => c.parentId === p.id)
                        .map((c) => row(c.id, c.name, true))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </Field>
        </div>
      )}

      {step === 1 && (
        <div>
          {langBar}
          <div key={lang} className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <Field label={`${t.svcForm.title} (${langLabel(lang)})`} required error={langErr('title')}>
              <Input placeholder="Agafay Desert Excursion" {...register(`${lang}.title`)} />
            </Field>
            <Field label={`${t.svcForm.subtitle} (${langLabel(lang)})`}>
              <Input placeholder="Sunset, dunes & a Berber dinner" {...register(`${lang}.subtitle`)} />
            </Field>
            <Field
              label={`${t.svcForm.description} (${langLabel(lang)})`}
              className="md:col-span-2"
              required
              error={langErr('description')}
            >
              <Input {...register(`${lang}.description`)} />
            </Field>
            <Field label={`${t.svcForm.tags} (${langLabel(lang)})`} className="md:col-span-2" hint={t.svcForm.commaSep}>
              <Input placeholder="Desert, Adventure, Marrakech" {...register(`${lang}.tagsText`)} />
            </Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-xl">
          <ImageUpload
            label={t.svcForm.photo}
            variant="cover"
            value={cover || thumb}
            onChange={(u) => {
              setValue('coverUrl', u);
              setValue('thumbUrl', u);
            }}
          />
          <p className="text-muted-foreground mt-2 text-sm">{t.svcForm.photoNote}</p>
        </div>
      )}

      {step === 3 && (
        <div>
          {langBar}
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
            <Field label={t.svcForm.priceMode}>
              <FieldSelect {...register('priceMode')}>
                <option value="PER_PERSON">{t.svcForm.mPerPerson}</option>
                <option value="PER_TRIP">{t.svcForm.mPerTrip}</option>
                <option value="FIXED">{t.svcForm.mFixed}</option>
                <option value="ON_QUOTE">{t.svcForm.mOnQuote}</option>
              </FieldSelect>
            </Field>
            {!isQuote && (
              <Field label={t.svcForm.price} required error={errors.price?.message}>
                <Input type="number" min={0} step="0.01" {...register('price')} />
              </Field>
            )}
            <Field label={t.svcForm.currency} error={errors.currency?.message}>
              <FieldSelect {...register('currency')}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </FieldSelect>
            </Field>
            {!isQuote && (
              <Field label={t.svcForm.accepted} hint={t.svcForm.acceptedHint} className="md:col-span-3">
                <div className="flex flex-wrap gap-2 pt-1">
                  {CURRENCIES.map((c) => {
                    const base = watch('currency') === c.code;
                    const checked = base || (watch('acceptedCurrencies') ?? []).includes(c.code);
                    return (
                      <label
                        key={c.code}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[15px] transition-colors',
                          checked ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                          base && 'opacity-70',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={base}
                          className="accent-primary"
                          onChange={(e) => {
                            const cur = watch('acceptedCurrencies') ?? [];
                            setValue(
                              'acceptedCurrencies',
                              e.target.checked
                                ? Array.from(new Set([...cur, c.code]))
                                : cur.filter((x) => x !== c.code),
                            );
                          }}
                        />
                        {c.code}
                      </label>
                    );
                  })}
                </div>
              </Field>
            )}
            <Field label={`${t.svcForm.priceUnit} (${langLabel(lang)})`} hint={t.svcForm.hintUnit}>
              <Input key={lang} {...register(`${lang}.priceUnit`)} />
            </Field>
            {!isProduct && (
              <Field label={t.svcForm.maxPeople}>
                <Input type="number" min={1} {...register('maxPeople')} />
              </Field>
            )}
            <Field label={t.svcForm.duration}>
              <Input type="number" min={0} {...register('durationMinutes')} />
            </Field>
            {!isProduct && (
              <Field label={t.svcForm.languages} hint={t.svcForm.commaSep}>
                <Input placeholder="Français, English, العربية" {...register('languagesText')} />
              </Field>
            )}
            <Field label={t.svcForm.visible}>
              <div className="flex h-11 items-center gap-3">
                <Switch checked={watch('active')} onCheckedChange={(v) => setValue('active', v)} />
                <span className="text-[15px]">{watch('active') ? t.common.active : t.common.hidden}</span>
              </div>
            </Field>
            {!isProduct && (
              <Field label={t.svcForm.requiresDate}>
                <div className="flex h-11 items-center gap-3">
                  <Switch checked={watch('requiresDate')} onCheckedChange={(v) => setValue('requiresDate', v)} />
                  <span className="text-[15px]">{watch('requiresDate') ? t.svcForm.yes : t.svcForm.no}</span>
                </div>
              </Field>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          {langBar}
          <div key={lang} className="space-y-8">
            <Repeater
              title={t.svcForm.optionsTitle}
              addLabel={t.svcForm.addOption}
              onAdd={addOption}
              rows={optionsFA.fields}
              onRemove={removeOption}
              render={(i) => (
                <>
                  <Input placeholder={`${t.svcForm.optionName} (${langLabel(lang)})`} {...register(`${lang}.options.${i}.name`)} />
                  <Input type="number" step="0.01" placeholder={t.svcForm.priceDelta} {...register(`optionPrices.${i}.priceDelta`)} />
                </>
              )}
            />
            <Repeater
              title={t.svcForm.extrasTitle}
              addLabel={t.svcForm.addExtra}
              onAdd={addExtra}
              rows={extrasFA.fields}
              onRemove={removeExtra}
              render={(i) => (
                <>
                  <Input placeholder={`${t.svcForm.extraName} (${langLabel(lang)})`} {...register(`${lang}.extras.${i}.name`)} />
                  <Input type="number" step="0.01" placeholder={t.svcForm.priceCol} {...register(`extraPrices.${i}.price`)} />
                </>
              )}
            />
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          {langBar}
          <div key={lang} className="space-y-8">
            <Repeater
              title={t.svcForm.includedTitle}
              addLabel={t.svcForm.addItem}
              onAdd={addIncluded}
              rows={includedFA.fields}
              onRemove={removeIncluded}
              render={(i) => (
                <>
                  <Input placeholder={`${t.svcForm.itemTitle} (${langLabel(lang)})`} {...register(`${lang}.included.${i}.title`)} />
                  <Input placeholder={`${t.svcForm.itemDesc} (${langLabel(lang)})`} {...register(`${lang}.included.${i}.description`)} />
                </>
              )}
            />
            <Repeater
              title={t.svcForm.practicalTitle}
              addLabel={t.svcForm.addInfo}
              onAdd={addInfo}
              rows={infoFA.fields}
              onRemove={removeInfo}
              render={(i) => (
                <>
                  <Input placeholder={`${t.svcForm.infoLabel} (${langLabel(lang)})`} {...register(`${lang}.info.${i}.label`)} />
                  <Input placeholder={`${t.svcForm.infoValue} (${langLabel(lang)})`} {...register(`${lang}.info.${i}.value`)} />
                </>
              )}
            />
          </div>
        </div>
      )}

      {step === 6 && <ReviewStep v={getValues()} lang={lang} rootError={errors.root?.message} />}
    </Wizard>
  );
}

function Repeater({
  title,
  addLabel,
  rows,
  onAdd,
  onRemove,
  render,
}: {
  title: string;
  addLabel: string;
  rows: { id: string }[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  render: (index: number) => React.ReactNode;
}) {
  const { t } = useAdminI18n();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-semibold">{title}</h4>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t.svcForm.noneAdded}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
              {render(i)}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive mb-2 transition-colors"
                aria-label={t.svcForm.remove}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  v,
  lang,
  rootError,
}: {
  v: Form;
  lang: Locale;
  rootError?: string;
}) {
  const { t } = useAdminI18n();
  const block = blockComplete(v[lang]) ? v[lang] : blockComplete(v.fr) ? v.fr : v.en;
  const langName = lang === 'fr' ? t.svcForm.langFr : t.svcForm.langEn;
  const rows: [string, string][] = [
    [t.svcForm.rType, v.type],
    [t.svcForm.rTitle, block.title],
    [t.svcForm.rPrice, v.type === 'QUOTE' ? t.svcForm.onQuote : `${v.price} ${v.currency} ${block.priceUnit ?? ''}`],
    [t.svcForm.contentLanguage, langName],
    [t.svcForm.rOptions, String(v.optionPrices.length)],
    [t.svcForm.rExtras, String(v.extraPrices.length)],
  ];
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted relative aspect-[16/5] w-full">
          {v.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              {t.svcForm.noCover}
            </div>
          )}
        </div>
        <div className="px-6 py-5">
          <h3 className="text-xl font-semibold">{block.title || t.svcForm.untitled}</h3>
          <p className="text-muted-foreground text-sm">{block.subtitle || block.description || '—'}</p>
        </div>
      </div>
      <div className="divide-y rounded-lg border">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3 text-[15px]">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-right font-medium">{val}</span>
          </div>
        ))}
      </div>
      {rootError ? <p className="text-destructive text-sm">{rootError}</p> : null}
    </div>
  );
}
