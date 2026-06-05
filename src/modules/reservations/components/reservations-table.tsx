'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { StatusBadge } from '@/components/ui';
import { DataTable, TABLE_PAGE_SIZE } from '@/components/tables';
import { fromMinorUnits } from '@/constants';
import { useAdminI18n } from '@/lib/i18n/provider';

import { useReservations } from '../hooks';
import type { Reservation } from '../types';
import { BookingDetailModal } from './booking-detail-modal';

type Dict = ReturnType<typeof useAdminI18n>['t'];

function money(cents: number, currency: string): string {
  return `${fromMinorUnits(cents, currency).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

function buildColumns(onView: (id: string) => void, t: Dict): ColumnDef<Reservation>[] {
  return [
    {
      accessorKey: 'code',
      header: t.common.reference,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
    },
    {
      accessorKey: 'customerName',
      header: t.bookings.customer,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.customerName ?? t.bookings.guest}</div>
          <div className="text-muted-foreground truncate text-xs">
            {row.original.customerEmail ?? '—'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'customerPhone',
      header: t.bookings.phone,
      cell: ({ row }) => row.original.customerPhone ?? '—',
    },
    {
      accessorKey: 'itemsSummary',
      header: t.bookings.services,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate">{row.original.itemsSummary}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.itemsCount} {t.bookings.items}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'scheduledAt',
      header: t.bookings.scheduled,
      cell: ({ row }) => fmtDate(row.original.scheduledAt),
    },
    {
      accessorKey: 'totalCents',
      header: t.common.total,
      cell: ({ row }) => money(row.original.totalCents, row.original.currency),
    },
    {
      accessorKey: 'status',
      header: t.common.status,
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} label={t.status[row.original.status]} />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t.common.created,
      cell: ({ row }) => fmtDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: t.common.actions,
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
  const { t } = useAdminI18n();
  const [page, setPage] = useState(1);
  // Reset to the first page whenever the filters change.
  useEffect(() => setPage(1), [status, search]);
  const { data, isLoading, isError, error } = useReservations({
    status,
    search,
    page,
    pageSize: TABLE_PAGE_SIZE,
  });
  const [viewId, setViewId] = useState<string | null>(null);

  return (
    <>
      {isLoading ? (
        <p className="text-muted-foreground p-4 text-sm">{t.bookings.loading}</p>
      ) : isError ? (
        <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>
      ) : (
        <DataTable
          columns={buildColumns(setViewId, t)}
          data={data?.items ?? []}
          emptyMessage={search || status ? t.bookings.emptyFiltered : t.bookings.empty}
          pagination={
            data
              ? { page: data.page, pageSize: data.pageSize, total: data.total, onPageChange: setPage }
              : undefined
          }
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
