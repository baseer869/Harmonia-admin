'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { fromMinorUnits } from '@/constants';

import { useReservations } from '../hooks';
import type { Reservation } from '../types';
import { BookingDetailModal } from './booking-detail-modal';

function money(cents: number, currency: string): string {
  return `${fromMinorUnits(cents, currency).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

function buildColumns(onView: (id: string) => void): ColumnDef<Reservation>[] {
  return [
    {
      accessorKey: 'code',
      header: 'Reference',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.customerName ?? 'Guest'}</div>
          <div className="text-muted-foreground truncate text-xs">
            {row.original.customerEmail ?? '—'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'customerPhone',
      header: 'Phone',
      cell: ({ row }) => row.original.customerPhone ?? '—',
    },
    {
      accessorKey: 'itemsSummary',
      header: 'Services',
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate">{row.original.itemsSummary}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.itemsCount} item{row.original.itemsCount === 1 ? '' : 's'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'scheduledAt',
      header: 'Scheduled',
      cell: ({ row }) => fmtDate(row.original.scheduledAt),
    },
    {
      accessorKey: 'totalCents',
      header: 'Total',
      cell: ({ row }) => money(row.original.totalCents, row.original.currency),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => fmtDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original.id)}
          className="text-primary/80 hover:text-primary transition-colors"
          aria-label="View booking"
        >
          <Eye className="size-4" />
        </button>
      ),
    },
  ];
}

export function ReservationsTable({
  status,
  search,
}: {
  status?: Reservation['status'];
  search?: string;
}) {
  const { data, isLoading, isError, error } = useReservations({ status, search });
  const [viewId, setViewId] = useState<string | null>(null);

  return (
    <>
      {isLoading ? (
        <p className="text-muted-foreground p-4 text-sm">Loading bookings…</p>
      ) : isError ? (
        <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>
      ) : (
        <DataTable
          columns={buildColumns(setViewId)}
          data={data?.items ?? []}
          emptyMessage={search || status ? 'No bookings match your filters.' : 'No bookings yet.'}
        />
      )}
      <BookingDetailModal
        id={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </>
  );
}
