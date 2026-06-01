'use client';

import { type ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui';
import { DataTable } from '@/components/tables';

import { useServices } from '../hooks';
import type { Service } from '../types';

function formatPrice(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

const columns: ColumnDef<Service>[] = [
  { accessorKey: 'title', header: 'Title' },
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
    accessorKey: 'priceCents',
    header: 'Price',
    cell: ({ row }) =>
      formatPrice(row.original.priceCents, row.original.currency),
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.active ? 'default' : 'secondary'}>
        {row.original.active ? 'Active' : 'Hidden'}
      </Badge>
    ),
  },
];

/** The tenant's own service catalog (scoped server-side by tenantId). */
export function ServicesTable() {
  const { data, isLoading, isError, error } = useServices();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading services…</p>;
  }
  if (isError) {
    return (
      <p className="text-destructive text-sm">
        {(error as Error).message}
      </p>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      emptyMessage="No services yet. Add the first one to your catalog."
    />
  );
}
