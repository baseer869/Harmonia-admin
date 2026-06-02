'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/tables';

import { useReservations } from '../hooks';
import type { Reservation } from '../types';

const columns: ColumnDef<Reservation>[] = [
  {
    accessorKey: 'code',
    header: 'Reference',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
  },
  {
    accessorKey: 'customerEmail',
    header: 'Customer',
    cell: ({ row }) => row.original.customerEmail ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'totalCents',
    header: 'Total',
    cell: ({ row }) =>
      `${(row.original.totalCents / 100).toLocaleString()} ${row.original.currency}`,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
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

export function ReservationsTable() {
  const { data, isLoading, isError, error } = useReservations();
  if (isLoading)
    return <p className="text-muted-foreground p-4 text-sm">Loading reservations…</p>;
  if (isError)
    return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;
  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      emptyMessage="No reservations yet."
    />
  );
}
