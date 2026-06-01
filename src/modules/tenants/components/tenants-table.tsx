'use client';

import { type ColumnDef } from '@tanstack/react-table';

import { Badge, type badgeVariants } from '@/components/ui';
import { DataTable } from '@/components/tables';
import type { VariantProps } from 'class-variance-authority';

import { useTenants } from '../hooks';
import type { Tenant, TenantStatus } from '../types';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const STATUS_VARIANT: Record<TenantStatus, BadgeVariant> = {
  ACTIVE: 'default',
  SUSPENDED: 'secondary',
  ARCHIVED: 'outline',
};

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
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
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
