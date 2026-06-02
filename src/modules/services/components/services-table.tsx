'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { type ColumnDef } from '@tanstack/react-table';

import { Eye, Pencil } from 'lucide-react';

import { StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { fromMinorUnits } from '@/constants';

import { useServices } from '../hooks';
import type { Service } from '../types';
import { ServicePreview } from './service-preview';

function formatPrice(cents: number, currency: string): string {
  return `${fromMinorUnits(cents, currency).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function buildColumns(onPreview: (s: Service) => void): ColumnDef<Service>[] {
  return [
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
        row.original.type === 'QUOTE'
          ? 'On request'
          : formatPrice(row.original.priceCents, row.original.currency),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.active ? 'Active' : 'Hidden'}
          tone={row.original.active ? 'green' : 'gray'}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
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
        </div>
      ),
    },
  ];
}

/** The tenant's own service catalog (scoped server-side by tenantId). */
export function ServicesTable() {
  const { data, isLoading, isError, error } = useServices();
  const [preview, setPreview] = useState<Service | null>(null);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading services…</p>;
  }
  if (isError) {
    return <p className="text-destructive text-sm">{(error as Error).message}</p>;
  }

  return (
    <>
      <DataTable
        columns={buildColumns(setPreview)}
        data={data?.items ?? []}
        emptyMessage="No services yet. Add the first one to your catalog."
      />
      <ServicePreview
        service={preview}
        open={preview !== null}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
