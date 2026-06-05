'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { Switch } from '@/components/ui';
import { DataTable, TABLE_PAGE_SIZE } from '@/components/tables';
import { useAdminI18n } from '@/lib/i18n/provider';

import { useCustomers, useSetCustomerStatus } from '../hooks';
import type { Customer } from '../types';

type Dict = ReturnType<typeof useAdminI18n>['t'];

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

function buildColumns(t: Dict): ColumnDef<Customer>[] {
  return [
    {
      id: 'rowId',
      header: t.lists.id,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.index + 1}</span>
      ),
    },
    { accessorKey: 'name', header: t.common.name, cell: ({ row }) => row.original.name ?? '—' },
    { accessorKey: 'email', header: t.common.email },
    { accessorKey: 'phone', header: t.common.phone, cell: ({ row }) => row.original.phone ?? '—' },
    { accessorKey: 'city', header: t.common.city, cell: ({ row }) => row.original.city ?? '—' },
    {
      id: 'actions',
      header: t.common.actions,
      cell: ({ row }) => <CustomerActions customer={row.original} />,
    },
  ];
}

export function CustomersTable() {
  const { t } = useAdminI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useCustomers({ page, pageSize: TABLE_PAGE_SIZE });
  if (isLoading)
    return <p className="text-muted-foreground p-4 text-sm">{t.common.loading}</p>;
  if (isError)
    return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;
  return (
    <DataTable
      columns={buildColumns(t)}
      data={data?.items ?? []}
      emptyMessage={t.lists.emptyCustomers}
      pagination={
        data
          ? { page: data.page, pageSize: data.pageSize, total: data.total, onPageChange: setPage }
          : undefined
      }
    />
  );
}
