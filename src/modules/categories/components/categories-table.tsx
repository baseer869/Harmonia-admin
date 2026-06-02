'use client';

import { type ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui';
import { DataTable } from '@/components/tables';

import { useCategories } from '../hooks';
import type { Category } from '../types';

const columns: ColumnDef<Category>[] = [
  {
    id: 'rowId',
    header: 'ID',
    cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
  },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'parentName',
    header: 'Parent',
    cell: ({ row }) =>
      row.original.parentName ? (
        <Badge variant="secondary">{row.original.parentName}</Badge>
      ) : (
        <span className="text-muted-foreground">Top level</span>
      ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-xs">{row.original.slug}</span>
    ),
  },
];

export function CategoriesTable() {
  const { data, isLoading, isError, error } = useCategories();
  if (isLoading) return <p className="text-muted-foreground p-4 text-sm">Loading categories…</p>;
  if (isError) return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;
  return (
    <DataTable columns={columns} data={data?.items ?? []} emptyMessage="No categories yet." />
  );
}
