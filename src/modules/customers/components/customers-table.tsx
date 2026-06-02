'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { Switch } from '@/components/ui';
import { DataTable } from '@/components/tables';

import { useCustomers, useSetCustomerStatus } from '../hooks';
import type { Customer } from '../types';

function CustomerActions({ customer }: { customer: Customer }) {
  const setStatus = useSetCustomerStatus();
  return (
    <div className="flex items-center gap-4">
      <Switch
        checked={customer.status === 'ACTIVE'}
        disabled={setStatus.isPending}
        aria-label="Toggle active"
        onCheckedChange={(next) =>
          setStatus.mutate({ id: customer.id, status: next ? 'ACTIVE' : 'BLOCKED' })
        }
      />
      <button
        type="button"
        className="text-primary/80 hover:text-primary transition-colors"
        aria-label="View"
      >
        <Eye className="size-[18px]" />
      </button>
    </div>
  );
}

const columns: ColumnDef<Customer>[] = [
  {
    id: 'rowId',
    header: 'ID',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.index + 1}</span>
    ),
  },
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => row.original.name ?? '—' },
  { accessorKey: 'email', header: 'Email ID' },
  { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => row.original.phone ?? '—' },
  { accessorKey: 'city', header: 'City', cell: ({ row }) => row.original.city ?? '—' },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <CustomerActions customer={row.original} />,
  },
];

export function CustomersTable() {
  const { data, isLoading, isError, error } = useCustomers();
  if (isLoading)
    return <p className="text-muted-foreground p-4 text-sm">Loading customers…</p>;
  if (isError)
    return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;
  return (
    <DataTable columns={columns} data={data?.items ?? []} emptyMessage="No customers yet." />
  );
}
