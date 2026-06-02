'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/components/ui';
import { Field, FieldSelect } from '@/components/forms';

import { createCategorySchema, type CreateCategoryInput } from '../validation';
import { useCategories, useCreateCategory } from '../hooks';

/** Create a category (max 2 levels — a child cannot itself be a parent). */
export function CreateCategoryForm() {
  const createCategory = useCreateCategory();
  const categories = useCategories();
  const parents = (categories.data?.items ?? []).filter((c) => !c.parentId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '', parentId: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createCategory.mutateAsync({ ...values, parentId: values.parentId || null });
    reset();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-x-8 gap-y-5 md:grid-cols-3">
      <Field label="Category name" required error={errors.name?.message}>
        <Input placeholder="Adventure" {...register('name')} />
      </Field>
      <Field label="Parent category" hint="Leave empty for a top-level category">
        <FieldSelect {...register('parentId')}>
          <option value="">— Top level —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </FieldSelect>
      </Field>
      <Field label="Description">
        <Input placeholder="Optional" {...register('description')} />
      </Field>
      <div className="md:col-span-3">
        <Button type="submit" disabled={isSubmitting || createCategory.isPending}>
          {createCategory.isPending ? 'Adding…' : 'Add category'}
        </Button>
      </div>
    </form>
  );
}
