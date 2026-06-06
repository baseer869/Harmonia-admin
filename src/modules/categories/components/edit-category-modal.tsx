'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input, Modal } from '@/components/ui';
import { Field, FieldSelect } from '@/components/forms';
import { useAdminI18n } from '@/lib/i18n/provider';

import { updateCategorySchema, type UpdateCategoryInput } from '../validation';
import { useCategories, useUpdateCategory } from '../hooks';
import type { Category } from '../types';

/** Edit a category (name / parent / description). */
export function EditCategoryModal({
  category,
  open,
  onClose,
}: {
  category: Category | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  const update = useUpdateCategory();
  const categories = useCategories();
  const parents = (categories.data?.items ?? []).filter(
    (c) => !c.parentId && c.id !== category?.id,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    values: category
      ? {
          name: category.name,
          parentId: category.parentId ?? '',
          description: category.description ?? '',
        }
      : { name: '', parentId: '', description: '' },
  });

  if (!category) return null;

  const onSubmit = handleSubmit(async (values) => {
    await update.mutateAsync({
      id: category.id,
      input: { ...values, parentId: values.parentId || null },
    });
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={t.common.edit}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Category name" required error={errors.name?.message}>
          <Input {...register('name')} />
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
          <Input {...register('description')} />
        </Field>
        {update.isError ? (
          <p className="text-destructive text-sm">{(update.error as Error).message}</p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting || update.isPending}>
            {update.isPending ? t.common.saving : t.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
