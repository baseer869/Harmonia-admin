'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2 } from 'lucide-react';

import { Input, StatusBadge } from '@/components/ui';
import {
  Field,
  FieldSelect,
  ImageUpload,
  Wizard,
  type WizardStep,
} from '@/components/forms';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants';
import { useCreateTenant } from '../hooks';

const onboardSchema = z.object({
  name: z.string().min(2, 'Required'),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  defaultCurrency: z.string().length(3),
  description: z.string().optional(),
  contactEmail: z.string().email('Invalid email').or(z.literal('')),
  contactPhone: z.string().optional(),
  logoUrl: z.string().optional().or(z.literal('')),
  coverUrl: z.string().optional().or(z.literal('')),
});

type OnboardInput = z.infer<typeof onboardSchema>;

const STEPS: WizardStep[] = [
  { id: 'tenant', label: 'Tenant Details' },
  { id: 'branding', label: 'Profile & Branding' },
  { id: 'review', label: 'Review' },
];

const STEP_FIELDS: (keyof OnboardInput)[][] = [
  ['name', 'status', 'defaultCurrency'],
  ['description', 'contactEmail', 'contactPhone'],
  [],
];

export function TenantOnboarding() {
  const router = useRouter();
  const createTenant = useCreateTenant();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OnboardInput>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      status: 'ACTIVE',
      defaultCurrency: DEFAULT_CURRENCY,
      contactEmail: '',
      logoUrl: '',
      coverUrl: '',
    },
  });
  const { register, trigger, getValues, setValue, watch, setError, formState } = form;
  const { errors } = formState;

  const next = async () => {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    if (!(await trigger())) return;
    setSubmitting(true);
    const v = getValues();
    try {
      await createTenant.mutateAsync({
        name: v.name,
        status: v.status,
        defaultCurrency: v.defaultCurrency,
        description: v.description,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone,
        logoUrl: v.logoUrl,
        coverUrl: v.coverUrl,
      });
      router.push('/tenants');
      router.refresh();
    } catch (err) {
      setError('root', { message: (err as Error).message });
      setStep(STEPS.length - 1);
    } finally {
      setSubmitting(false);
    }
  };

  const logoUrl = watch('logoUrl');
  const coverUrl = watch('coverUrl');

  return (
    <Wizard
      title="Onboard Tenant"
      backHref="/tenants"
      steps={STEPS}
      current={step}
      onStepChange={setStep}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      onSubmit={submit}
      isSubmitting={submitting}
      submitLabel="Create tenant"
    >
      {step === 0 && (
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
          <Field label="Tenant name" required error={errors.name?.message}>
            <Input placeholder="Marrakech Luxury Concierge" {...register('name')} />
          </Field>
          <Field label="Status">
            <FieldSelect {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </FieldSelect>
          </Field>
          <Field
            label="Default currency"
            hint="Used for this tenant's pricing & payments"
            error={errors.defaultCurrency?.message}
          >
            <FieldSelect {...register('defaultCurrency')}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </FieldSelect>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8">
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <Field label="Description" className="md:col-span-2">
              <Input placeholder="Short description of the business" {...register('description')} />
            </Field>
            <Field label="Contact email" error={errors.contactEmail?.message}>
              <Input type="email" placeholder="hello@tenant.com" {...register('contactEmail')} />
            </Field>
            <Field label="Contact phone">
              <Input placeholder="+212 6 00 00 00 00" {...register('contactPhone')} />
            </Field>
          </div>
          <div className="grid gap-8 md:grid-cols-[auto_1fr]">
            <ImageUpload
              label="Logo"
              variant="logo"
              value={logoUrl}
              onChange={(url) => setValue('logoUrl', url)}
            />
            <ImageUpload
              label="Cover / banner"
              variant="cover"
              value={coverUrl}
              onChange={(url) => setValue('coverUrl', url)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <ReviewStep values={getValues()} rootError={errors.root?.message} />
      )}
    </Wizard>
  );
}

function ReviewStep({
  values,
  rootError,
}: {
  values: OnboardInput;
  rootError?: string;
}) {
  const currency = CURRENCIES.find((c) => c.code === values.defaultCurrency);
  const details: [string, string][] = [
    ['Status', values.status],
    ['Currency', currency ? `${currency.code} — ${currency.name}` : values.defaultCurrency],
    ['Contact email', values.contactEmail || '—'],
    ['Contact phone', values.contactPhone || '—'],
    ['Description', values.description || '—'],
  ];

  return (
    <div className="space-y-6">
      {/* Brand preview card */}
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted relative aspect-[16/5] w-full">
          {values.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              No cover image
            </div>
          )}
          <div className="absolute -bottom-8 left-6">
            <div className="bg-card grid size-20 place-items-center overflow-hidden rounded-xl border-4 shadow-sm">
              {values.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="text-muted-foreground size-8" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-6 pt-12 pb-5">
          <div>
            <h3 className="text-xl font-semibold">{values.name || 'Untitled tenant'}</h3>
            <p className="text-muted-foreground text-sm">
              {values.description || 'No description'}
            </p>
          </div>
          <StatusBadge status={values.status} />
        </div>
      </div>

      <div className="divide-y rounded-lg border">
        {details.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3 text-[15px]">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-right font-medium">{v}</span>
          </div>
        ))}
      </div>

      {rootError ? <p className="text-destructive text-sm">{rootError}</p> : null}
    </div>
  );
}
