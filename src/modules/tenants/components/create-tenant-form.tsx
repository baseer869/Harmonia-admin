'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/components/ui';

import { createTenantSchema, type CreateTenantInput } from '../validation';
import { useCreateTenant } from '../hooks';

/**
 * Create-tenant form — demonstrates React Hook Form + Zod (shared schema) +
 * a TanStack Query mutation hitting the module API.
 */
export function CreateTenantForm({ onCreated }: { onCreated?: () => void }) {
  const createTenant = useCreateTenant();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: '', status: 'ACTIVE' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createTenant.mutateAsync(values);
    reset();
    onCreated?.();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1 space-y-1">
        <Input placeholder="Tenant name" {...register('name')} />
        {errors.name ? (
          <p className="text-destructive text-xs">{errors.name.message}</p>
        ) : null}
      </div>
      <div className="flex-1 space-y-1">
        <Input placeholder="slug (optional)" {...register('slug')} />
        {errors.slug ? (
          <p className="text-destructive text-xs">{errors.slug.message}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting || createTenant.isPending}>
        {createTenant.isPending ? 'Creating…' : 'Create tenant'}
      </Button>
    </form>
  );
}
