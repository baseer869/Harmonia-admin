'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { useAdminI18n } from '@/lib/i18n/provider';

import { useCategories, useDeleteCategory } from '../hooks';
import type { Category } from '../types';
import { EditCategoryModal } from './edit-category-modal';

type Dict = ReturnType<typeof useAdminI18n>['t'];

function buildColumns(
  t: Dict,
  onEdit: (c: Category) => void,
  onDelete: (c: Category) => void,
): ColumnDef<Category>[] {
  return [
    {
      id: 'rowId',
      header: t.lists.id,
      cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
    },
    { accessorKey: 'name', header: t.common.name },
    {
      accessorKey: 'parentName',
      header: t.lists.parent,
      cell: ({ row }) =>
        row.original.parentName ? (
          <Badge variant="secondary">{row.original.parentName}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'slug',
      header: t.lists.slug,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.slug}</span>
      ),
    },
    {
      id: 'actions',
      header: t.common.actions,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit(row.original)}
            className="text-primary/80 hover:text-primary transition-colors"
            aria-label={t.common.edit}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(row.original)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];
}

export function CategoriesTable() {
  const { t } = useAdminI18n();
  const { data, isLoading, isError, error } = useCategories();
  const del = useDeleteCategory();
  const [edit, setEdit] = useState<Category | null>(null);

  const onDelete = (c: Category) => {
    if (window.confirm(`${t.common.delete} "${c.name}"?`)) del.mutate(c.id);
  };

  if (isLoading) return <p className="text-muted-foreground p-4 text-sm">{t.common.loading}</p>;
  if (isError) return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;

  return (
    <>
      <DataTable
        columns={buildColumns(t, setEdit, onDelete)}
        data={data?.items ?? []}
        emptyMessage={t.lists.emptyCategories}
      />
      <EditCategoryModal category={edit} open={edit !== null} onClose={() => setEdit(null)} />
    </>
  );
}
