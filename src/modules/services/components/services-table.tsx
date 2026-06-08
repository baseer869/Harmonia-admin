'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { type ColumnDef } from '@tanstack/react-table';

import { Eye, Pencil, Trash2 } from 'lucide-react';

import { StatusBadge } from '@/components/ui';
import { DataTable, TABLE_PAGE_SIZE } from '@/components/tables';
import { fromMinorUnits } from '@/constants';
import { useAdminI18n } from '@/lib/i18n/provider';

import { useServices, useDeleteService } from '../hooks';
import type { Service } from '../types';
import { ServicePreview } from './service-preview';

type Dict = ReturnType<typeof useAdminI18n>['t'];

/** Delete a service (with confirm); a booked service returns a clear message. */
function DeleteServiceButton({ service, t }: { service: Service; t: Dict }) {
  const del = useDeleteService();
  const onClick = () => {
    if (!window.confirm(t.services.confirmDelete)) return;
    del.mutate(service.id, { onError: (e) => window.alert((e as Error).message) });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={del.isPending}
      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
      aria-label="Delete"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function formatPrice(cents: number, currency: string): string {
  return `${fromMinorUnits(cents, currency).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function buildColumns(onPreview: (s: Service) => void, t: Dict): ColumnDef<Service>[] {
  return [
    { accessorKey: 'title', header: t.services.title },
    {
      accessorKey: 'slug',
      header: t.services.slug,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.slug}
        </span>
      ),
    },
    {
      accessorKey: 'priceCents',
      header: t.services.price,
      cell: ({ row }) =>
        row.original.type === 'QUOTE'
          ? t.services.onRequest
          : formatPrice(row.original.priceCents, row.original.currency),
    },
    {
      accessorKey: 'active',
      header: t.common.status,
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.active ? 'Active' : 'Hidden'}
          tone={row.original.active ? 'green' : 'gray'}
          label={row.original.active ? t.common.active : t.common.hidden}
        />
      ),
    },
    {
      id: 'actions',
      header: t.common.actions,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPreview(row.original)}
            className="text-primary/80 hover:text-primary transition-colors"
            aria-label="Preview"
          >
            <Eye className="size-4" />
          </button>
          <Link
            href={`/services/${row.original.id}/edit` as Route}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit"
          >
            <Pencil className="size-4" />
          </Link>
          <DeleteServiceButton service={row.original} t={t} />
        </div>
      ),
    },
  ];
}

/** The tenant's own service catalog (scoped server-side by tenantId). */
export function ServicesTable() {
  const { t } = useAdminI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useServices({ page, pageSize: TABLE_PAGE_SIZE });
  const [preview, setPreview] = useState<Service | null>(null);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{t.services.loading}</p>;
  }
  if (isError) {
    return <p className="text-destructive text-sm">{(error as Error).message}</p>;
  }

  return (
    <>
      <DataTable
        columns={buildColumns(setPreview, t)}
        data={data?.items ?? []}
        emptyMessage={t.services.empty}
        pagination={
          data
            ? { page: data.page, pageSize: data.pageSize, total: data.total, onPageChange: setPage }
            : undefined
        }
      />
      <ServicePreview
        service={preview}
        open={preview !== null}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
