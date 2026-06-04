'use client';

import { type ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { useAdminI18n } from '@/lib/i18n/provider';

import { useCategories } from '../hooks';
import type { Category } from '../types';

type Dict = ReturnType<typeof useAdminI18n>['t'];

function buildColumns(t: Dict): ColumnDef<Category>[] {
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
  ];
}

export function CategoriesTable() {
  const { t } = useAdminI18n();
  const { data, isLoading, isError, error } = useCategories();
  if (isLoading) return <p className="text-muted-foreground p-4 text-sm">{t.common.loading}</p>;
  if (isError) return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;
  return (
    <DataTable columns={buildColumns(t)} data={data?.items ?? []} emptyMessage={t.lists.emptyCategories} />
  );
}
