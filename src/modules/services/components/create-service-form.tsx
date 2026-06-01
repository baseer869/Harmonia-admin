'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/components/ui';

import { createServiceSchema, type CreateServiceInput } from '../validation';
import { useCreateService } from '../hooks';

/** Add a catalog item — RHF + Zod + a TanStack Query mutation. */
export function CreateServiceForm({ onCreated }: { onCreated?: () => void }) {
  const createService = useCreateService();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: { title: '', priceCents: 0, currency: 'MAD', active: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createService.mutateAsync(values);
    reset();
    onCreated?.();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1 space-y-1">
        <Input placeholder="Service title" {...register('title')} />
        {errors.title ? (
          <p className="text-destructive text-xs">{errors.title.message}</p>
        ) : null}
      </div>
      <div className="w-40 space-y-1">
        <Input
          type="number"
          min={0}
          placeholder="Price (cents)"
          {...register('priceCents')}
        />
        {errors.priceCents ? (
          <p className="text-destructive text-xs">
            {errors.priceCents.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting || createService.isPending}>
        {createService.isPending ? 'Adding…' : 'Add service'}
      </Button>
    </form>
  );
}
