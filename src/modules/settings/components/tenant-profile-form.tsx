'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/components/ui';
import {
  tenantProfileSchema,
  type TenantProfileInput,
} from '@/modules/tenants';

import { useTenantProfile, useUpdateTenantProfile } from '../hooks';

/**
 * Tenant profile self-service form. A Tenant Admin edits their OWN tenant's
 * profile; the schema is owned by the tenants module (single source of truth).
 */
export function TenantProfileForm() {
  const { data, isLoading, isError, error } = useTenantProfile();
  const updateProfile = useUpdateTenantProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TenantProfileInput>({
    resolver: zodResolver(tenantProfileSchema),
    defaultValues: { name: '' },
  });

  // Hydrate the form once the profile loads.
  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        description: data.description ?? '',
        contactEmail: data.contactEmail ?? '',
        contactPhone: data.contactPhone ?? '',
        logoUrl: data.logoUrl ?? '',
      });
    }
  }, [data, reset]);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading profile…</p>;
  }
  if (isError) {
    return <p className="text-destructive text-sm">{(error as Error).message}</p>;
  }

  const onSubmit = handleSubmit(async (values) => {
    await updateProfile.mutateAsync(values);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <Field label="Business name" error={errors.name?.message}>
        <Input {...register('name')} />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <Input {...register('description')} placeholder="Short description" />
      </Field>
      <Field label="Contact email" error={errors.contactEmail?.message}>
        <Input type="email" {...register('contactEmail')} />
      </Field>
      <Field label="Contact phone" error={errors.contactPhone?.message}>
        <Input {...register('contactPhone')} />
      </Field>
      <Field label="Logo URL" error={errors.logoUrl?.message}>
        <Input {...register('logoUrl')} placeholder="https://…" />
      </Field>

      <Button
        type="submit"
        disabled={!isDirty || isSubmitting || updateProfile.isPending}
      >
        {updateProfile.isPending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
