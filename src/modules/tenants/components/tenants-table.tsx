'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

import { Eye } from 'lucide-react';

import { StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { useAdminI18n } from '@/lib/i18n/provider';

import { useTenants } from '../hooks';
import type { Tenant } from '../types';

type Dict = ReturnType<typeof useAdminI18n>['t'];

function buildColumns(t: Dict): ColumnDef<Tenant>[] {
  return [
    { accessorKey: 'name', header: t.common.name },
    {
      accessorKey: 'slug',
      header: t.lists.slug,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.slug}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t.common.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: t.common.created,
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      id: 'actions',
      header: t.common.actions,
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
}

/** Tenants listing — demonstrates Page → hook → /api → Module API → Service. */
export function TenantsTable() {
  const { t } = useAdminI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useTenants({ page });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{t.lists.loadingTenants}</p>;
  }
  if (isError) {
    return (
      <p className="text-destructive text-sm">{(error as Error).message}</p>
    );
  }

  return (
    <DataTable
      columns={buildColumns(t)}
      data={data?.items ?? []}
      emptyMessage={t.lists.emptyTenants}
      pagination={
        data
          ? { page: data.page, pageSize: data.pageSize, total: data.total, onPageChange: setPage }
          : undefined
      }
    />
  );
}
