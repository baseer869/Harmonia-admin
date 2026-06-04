'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';

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
import { useTenants } from '@/modules/tenants';
import { useCategories } from '@/modules/categories';
import { useAdminI18n } from '@/lib/i18n/provider';
import { useCreateService, useUpdateService } from '../hooks';
import type { Service } from '../types';

const schema = z.object({
  tenantId: z.string().min(1, 'Select a tenant'),
  categoryId: z.string().optional(),
  type: z.enum(['EXPERIENCE', 'TRANSFER', 'PRODUCT', 'QUOTE']),
  title: z.string().min(2, 'Required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  tagsText: z.string().optional(),
  coverUrl: z.string().optional(),
  thumbUrl: z.string().optional(),
  priceMode: z.enum(['PER_PERSON', 'PER_TRIP', 'FIXED', 'ON_QUOTE']),
  price: z.coerce.number().min(0),
  currency: z.string().length(3),
  acceptedCurrencies: z.array(z.string()).default([]),
  priceUnit: z.string().optional(),
  requiresDate: z.boolean(),
  maxPeople: z.coerce.number().int().min(1).optional().or(z.literal('')),
  durationMinutes: z.coerce.number().int().min(0).optional().or(z.literal('')),
  languagesText: z.string().optional(),
  active: z.boolean(),
  featured: z.boolean(),
  options: z.array(z.object({ name: z.string(), priceDelta: z.coerce.number() })),
  extras: z.array(z.object({ name: z.string(), price: z.coerce.number() })),
  included: z.array(z.object({ title: z.string(), description: z.string() })),
  info: z.array(z.object({ label: z.string(), value: z.string() })),
});
type Form = z.infer<typeof schema>;

const STEPS: WizardStep[] = [
  { id: 'type', label: 'Type & Category' },
  { id: 'general', label: 'General' },
  { id: 'media', label: 'Media' },
  { id: 'pricing', label: 'Pricing & Booking' },
  { id: 'options', label: 'Options & Extras' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
];

const TYPE_DEFAULT_MODE: Record<Form['type'], Form['priceMode']> = {
  EXPERIENCE: 'PER_PERSON',
  TRANSFER: 'PER_TRIP',
  PRODUCT: 'FIXED',
  QUOTE: 'ON_QUOTE',
};

const csv = (s?: string) =>
  (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);

/** Map an existing Service into the wizard's form values (edit mode). */
function toFormValues(s: Service): Form {
  const minor = (cents: number) => fromMinorUnits(cents, s.currency);
  return {
    tenantId: s.tenantId,
    categoryId: s.categoryId ?? '',
    type: s.type,
    title: s.title,
    subtitle: s.subtitle ?? '',
    description: s.description ?? '',
    tagsText: s.tags.join(', '),
    coverUrl: s.coverUrl ?? '',
    thumbUrl: s.thumbUrl ?? '',
    priceMode: s.priceMode,
    price: minor(s.priceCents),
    currency: s.currency,
    acceptedCurrencies: s.acceptedCurrencies ?? [],
    priceUnit: s.priceUnit ?? '',
    requiresDate: s.requiresDate,
    maxPeople: s.maxPeople ?? '',
    durationMinutes: s.durationMinutes ?? '',
    languagesText: s.languages.join(', '),
    active: s.active,
    featured: s.featured,
    options: s.options.map((o) => ({ name: o.name, priceDelta: minor(o.priceDeltaCents) })),
    extras: s.extras.map((e) => ({ name: e.name, price: minor(e.priceCents) })),
    included: s.included.map((i) => ({ title: i.title, description: i.description })),
    info: s.info.map((i) => ({ label: i.label, value: i.value })),
  } as Form;
}

export function ServiceOnboarding({ service }: { service?: Service }) {
  const router = useRouter();
  const { t } = useAdminI18n();
  const isEdit = Boolean(service);
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
          options: [],
          extras: [],
          included: [],
          info: [],
        },
  });
  const { register, control, trigger, getValues, setValue, watch, setError, formState } = form;
  const { errors } = formState;

  const optionsFA = useFieldArray({ control, name: 'options' });
  const extrasFA = useFieldArray({ control, name: 'extras' });
  const includedFA = useFieldArray({ control, name: 'included' });
  const infoFA = useFieldArray({ control, name: 'info' });

  const type = watch('type');
  const isProduct = type === 'PRODUCT';
  const isQuote = type === 'QUOTE';

  const STEP_FIELDS: (keyof Form)[][] = [
    ['tenantId', 'type'],
    ['title'],
    [],
    isQuote ? ['currency'] : ['price', 'currency'],
    [],
    [],
    [],
  ];

  const next = async () => {
    if (await trigger(STEP_FIELDS[step] as never)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    if (!(await trigger())) return;
    setSubmitting(true);
    const v = getValues();
    const payload = {
      categoryId: v.categoryId || undefined,
      type: v.type,
      title: v.title,
      subtitle: v.subtitle || undefined,
      description: v.description || undefined,
      tags: csv(v.tagsText),
      coverUrl: v.coverUrl || '',
      thumbUrl: v.thumbUrl || '',
      priceMode: v.priceMode,
      priceCents: isQuote ? 0 : toMinorUnits(Number(v.price), v.currency),
      currency: v.currency,
      // Always include the base price currency among the accepted ones.
      acceptedCurrencies: Array.from(new Set([v.currency, ...v.acceptedCurrencies])),
      priceUnit: v.priceUnit || undefined,
      requiresDate: isProduct ? false : v.requiresDate,
      maxPeople: v.maxPeople ? Number(v.maxPeople) : undefined,
      durationMinutes: v.durationMinutes ? Number(v.durationMinutes) : undefined,
      languages: csv(v.languagesText),
      active: v.active,
      featured: v.featured,
      options: v.options
        .filter((o) => o.name)
        .map((o) => ({ name: o.name, priceDeltaCents: toMinorUnits(Number(o.priceDelta) || 0, v.currency) })),
      extras: v.extras
        .filter((e) => e.name)
        .map((e) => ({ name: e.name, priceCents: toMinorUnits(Number(e.price) || 0, v.currency) })),
      included: v.included.filter((i) => i.title),
      info: v.info.filter((i) => i.label),
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
      setStep(STEPS.length - 1);
    } finally {
      setSubmitting(false);
    }
  };

  const cover = watch('coverUrl');
  const thumb = watch('thumbUrl');

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
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
          <Field label={t.svcForm.title} required error={errors.title?.message}>
            <Input placeholder="Agafay Desert Excursion" {...register('title')} />
          </Field>
          <Field label={t.svcForm.subtitle}>
            <Input placeholder="Sunset, dunes & a Berber dinner" {...register('subtitle')} />
          </Field>
          <Field label={t.svcForm.description} className="md:col-span-2">
            <Input {...register('description')} />
          </Field>
          <Field label={t.svcForm.tags} className="md:col-span-2" hint={t.svcForm.commaSep}>
            <Input placeholder="Desert, Adventure, Marrakech" {...register('tagsText')} />
          </Field>
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
          <p className="text-muted-foreground mt-2 text-sm">
            {t.svcForm.photoNote}
          </p>
        </div>
      )}

      {step === 3 && (
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
          <Field label={t.svcForm.priceUnit} hint={t.svcForm.hintUnit}>
            <Input {...register('priceUnit')} />
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
      )}

      {step === 4 && (
        <div className="space-y-8">
          <Repeater
            title={t.svcForm.optionsTitle}
            addLabel={t.svcForm.addOption}
            onAdd={() => optionsFA.append({ name: '', priceDelta: 0 })}
            rows={optionsFA.fields}
            onRemove={optionsFA.remove}
            render={(i) => (
              <>
                <Input placeholder={t.svcForm.optionName} {...register(`options.${i}.name`)} />
                <Input type="number" step="0.01" placeholder={t.svcForm.priceDelta} {...register(`options.${i}.priceDelta`)} />
              </>
            )}
          />
          <Repeater
            title={t.svcForm.extrasTitle}
            addLabel={t.svcForm.addExtra}
            onAdd={() => extrasFA.append({ name: '', price: 0 })}
            rows={extrasFA.fields}
            onRemove={extrasFA.remove}
            render={(i) => (
              <>
                <Input placeholder={t.svcForm.extraName} {...register(`extras.${i}.name`)} />
                <Input type="number" step="0.01" placeholder={t.svcForm.priceCol} {...register(`extras.${i}.price`)} />
              </>
            )}
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-8">
          <Repeater
            title={t.svcForm.includedTitle}
            addLabel={t.svcForm.addItem}
            onAdd={() => includedFA.append({ title: '', description: '' })}
            rows={includedFA.fields}
            onRemove={includedFA.remove}
            render={(i) => (
              <>
                <Input placeholder={t.svcForm.itemTitle} {...register(`included.${i}.title`)} />
                <Input placeholder={t.svcForm.itemDesc} {...register(`included.${i}.description`)} />
              </>
            )}
          />
          <Repeater
            title={t.svcForm.practicalTitle}
            addLabel={t.svcForm.addInfo}
            onAdd={() => infoFA.append({ label: '', value: '' })}
            rows={infoFA.fields}
            onRemove={infoFA.remove}
            render={(i) => (
              <>
                <Input placeholder={t.svcForm.infoLabel} {...register(`info.${i}.label`)} />
                <Input placeholder={t.svcForm.infoValue} {...register(`info.${i}.value`)} />
              </>
            )}
          />
        </div>
      )}

      {step === 6 && <ReviewStep v={getValues()} rootError={errors.root?.message} />}
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

function ReviewStep({ v, rootError }: { v: Form; rootError?: string }) {
  const { t } = useAdminI18n();
  const rows: [string, string][] = [
    [t.svcForm.rType, v.type],
    [t.svcForm.rTitle, v.title],
    [t.svcForm.rPrice, v.type === 'QUOTE' ? t.svcForm.onQuote : `${v.price} ${v.currency} ${v.priceUnit ?? ''}`],
    [t.svcForm.rOptions, String(v.options.filter((o) => o.name).length)],
    [t.svcForm.rExtras, String(v.extras.filter((e) => e.name).length)],
    [t.svcForm.rIncluded, String(v.included.filter((i) => i.title).length)],
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
          <h3 className="text-xl font-semibold">{v.title || t.svcForm.untitled}</h3>
          <p className="text-muted-foreground text-sm">{v.subtitle || v.description || '—'}</p>
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
