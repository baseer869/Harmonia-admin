'use client';

import { type ColumnDef } from '@tanstack/react-table';

import { Eye } from 'lucide-react';

import { StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/tables';

import { useTenants } from '../hooks';
import type { Tenant } from '../types';

const columns: ColumnDef<Tenant>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-xs">
        {row.original.slug}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <button
        type="button"
        className="text-primary/80 hover:text-primary transition-colors"
        aria-label="View"
      >
        <Eye className="size-4" />
      </button>
    ),
  },
];

/** Tenants listing — demonstrates Page → hook → /api → Module API → Service. */
export function TenantsTable() {
  const { data, isLoading, isError, error } = useTenants();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading tenants…</p>;
  }
  if (isError) {
    return (
      <p className="text-destructive text-sm">
        Failed to load tenants: {(error as Error).message}
      </p>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      emptyMessage="No tenants yet. Create the first one."
    />
  );
}
