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
import { useTenants } from '@/modules/tenants';
import { useCategories } from '@/modules/categories';
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
  const isEdit = Boolean(service);
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
      title={isEdit ? 'Edit Service' : 'Add Service'}
      backHref="/services"
      steps={STEPS}
      current={step}
      onStepChange={setStep}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      onSubmit={submit}
      isSubmitting={submitting}
      submitLabel={isEdit ? 'Save changes' : 'Create service'}
    >
      {step === 0 && (
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
          <Field label="Tenant" required error={errors.tenantId?.message}>
            <FieldSelect {...register('tenantId')} disabled={isEdit}>
              <option value="">Select a tenant…</option>
              {tenants.data?.items.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </FieldSelect>
          </Field>
          <Field label="Service type" hint="Drives the booking form">
            <FieldSelect
              {...register('type')}
              onChange={(e) => {
                const t = e.target.value as Form['type'];
                setValue('type', t);
                setValue('priceMode', TYPE_DEFAULT_MODE[t]);
              }}
            >
              <option value="EXPERIENCE">Experience (date · people)</option>
              <option value="TRANSFER">Transfer (per trip)</option>
              <option value="PRODUCT">Product (quantity)</option>
              <option value="QUOTE">On quote (enquiry)</option>
            </FieldSelect>
          </Field>
          <Field label="Category" hint="Optional">
            <FieldSelect {...register('categoryId')}>
              <option value="">— None —</option>
              {categories.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
                </option>
              ))}
            </FieldSelect>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
          <Field label="Title" required error={errors.title?.message}>
            <Input placeholder="Agafay Desert Excursion" {...register('title')} />
          </Field>
          <Field label="Subtitle">
            <Input placeholder="Sunset, dunes & a Berber dinner" {...register('subtitle')} />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <Input placeholder="Full description" {...register('description')} />
          </Field>
          <Field label="Tags" className="md:col-span-2" hint="Comma-separated">
            <Input placeholder="Desert, Adventure, Marrakech" {...register('tagsText')} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-xl">
          <ImageUpload
            label="Photo"
            variant="cover"
            value={cover || thumb}
            onChange={(u) => {
              setValue('coverUrl', u);
              setValue('thumbUrl', u);
            }}
          />
          <p className="text-muted-foreground mt-2 text-sm">
            One photo is enough — it’s used as both the cover and the thumbnail.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
          <Field label="Price mode">
            <FieldSelect {...register('priceMode')}>
              <option value="PER_PERSON">Per person</option>
              <option value="PER_TRIP">Per trip</option>
              <option value="FIXED">Fixed</option>
              <option value="ON_QUOTE">On quote</option>
            </FieldSelect>
          </Field>
          {!isQuote && (
            <Field label="Price" required error={errors.price?.message}>
              <Input type="number" min={0} step="0.01" {...register('price')} />
            </Field>
          )}
          <Field label="Currency" error={errors.currency?.message}>
            <FieldSelect {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </FieldSelect>
          </Field>
          <Field label="Price unit" hint='e.g. "/ pers.", "/ trip"'>
            <Input placeholder="per person" {...register('priceUnit')} />
          </Field>
          {!isProduct && (
            <Field label="Max people">
              <Input type="number" min={1} {...register('maxPeople')} />
            </Field>
          )}
          <Field label="Duration (minutes)">
            <Input type="number" min={0} {...register('durationMinutes')} />
          </Field>
          {!isProduct && (
            <Field label="Languages" hint="Comma-separated">
              <Input placeholder="Français, English, العربية" {...register('languagesText')} />
            </Field>
          )}
          <Field label="Visible in catalog">
            <div className="flex h-11 items-center gap-3">
              <Switch checked={watch('active')} onCheckedChange={(v) => setValue('active', v)} />
              <span className="text-[15px]">{watch('active') ? 'Active' : 'Hidden'}</span>
            </div>
          </Field>
          {!isProduct && (
            <Field label="Requires a date">
              <div className="flex h-11 items-center gap-3">
                <Switch checked={watch('requiresDate')} onCheckedChange={(v) => setValue('requiresDate', v)} />
                <span className="text-[15px]">{watch('requiresDate') ? 'Yes' : 'No'}</span>
              </div>
            </Field>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8">
          <Repeater
            title="Options / formulas"
            addLabel="Add option"
            onAdd={() => optionsFA.append({ name: '', priceDelta: 0 })}
            rows={optionsFA.fields}
            onRemove={optionsFA.remove}
            render={(i) => (
              <>
                <Input placeholder="Option name" {...register(`options.${i}.name`)} />
                <Input type="number" step="0.01" placeholder="Price delta" {...register(`options.${i}.priceDelta`)} />
              </>
            )}
          />
          <Repeater
            title="Extras / add-ons"
            addLabel="Add extra"
            onAdd={() => extrasFA.append({ name: '', price: 0 })}
            rows={extrasFA.fields}
            onRemove={extrasFA.remove}
            render={(i) => (
              <>
                <Input placeholder="Extra name" {...register(`extras.${i}.name`)} />
                <Input type="number" step="0.01" placeholder="Price" {...register(`extras.${i}.price`)} />
              </>
            )}
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-8">
          <Repeater
            title="What's included"
            addLabel="Add item"
            onAdd={() => includedFA.append({ title: '', description: '' })}
            rows={includedFA.fields}
            onRemove={includedFA.remove}
            render={(i) => (
              <>
                <Input placeholder="Title" {...register(`included.${i}.title`)} />
                <Input placeholder="Description" {...register(`included.${i}.description`)} />
              </>
            )}
          />
          <Repeater
            title="Practical info"
            addLabel="Add info"
            onAdd={() => infoFA.append({ label: '', value: '' })}
            rows={infoFA.fields}
            onRemove={infoFA.remove}
            render={(i) => (
              <>
                <Input placeholder="Label (e.g. Duration)" {...register(`info.${i}.label`)} />
                <Input placeholder="Value" {...register(`info.${i}.value`)} />
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
        <p className="text-muted-foreground text-sm">None added.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
              {render(i)}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive mb-2 transition-colors"
                aria-label="Remove"
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
  const rows: [string, string][] = [
    ['Type', v.type],
    ['Title', v.title],
    ['Price', v.type === 'QUOTE' ? 'On quote' : `${v.price} ${v.currency} ${v.priceUnit ?? ''}`],
    ['Options', String(v.options.filter((o) => o.name).length)],
    ['Extras', String(v.extras.filter((e) => e.name).length)],
    ['Included', String(v.included.filter((i) => i.title).length)],
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
              No cover image
            </div>
          )}
        </div>
        <div className="px-6 py-5">
          <h3 className="text-xl font-semibold">{v.title || 'Untitled service'}</h3>
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
