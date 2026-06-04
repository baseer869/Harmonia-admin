'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil } from 'lucide-react';

import { Switch } from '@/components/ui';
import { DataTable } from '@/components/tables';
import { useAdminI18n } from '@/lib/i18n/provider';

import { useUpdateUser, useUsers } from '../hooks';
import type { AdminUser } from '../types';

type Dict = ReturnType<typeof useAdminI18n>['t'];

function UserActions({ user }: { user: AdminUser }) {
  const update = useUpdateUser();
  return (
    <div className="flex items-center gap-4">
      <Switch
        checked={user.isActive}
        disabled={update.isPending}
        aria-label="Toggle active"
        onCheckedChange={(next) => update.mutate({ id: user.id, isActive: next })}
      />
      <button
        type="button"
        className="text-primary/80 hover:text-primary transition-colors"
        aria-label="Edit"
      >
        <Pencil className="size-[18px]" />
      </button>
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

function buildColumns(t: Dict): ColumnDef<AdminUser>[] {
  return [
    {
      id: 'rowId',
      header: t.lists.id,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: t.common.name,
      cell: ({ row }) => row.original.name ?? '—',
    },
    { accessorKey: 'email', header: t.common.email },
    {
      accessorKey: 'phone',
      header: t.common.phone,
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      accessorKey: 'city',
      header: t.common.city,
      cell: ({ row }) => row.original.city ?? '—',
    },
    {
      id: 'actions',
      header: t.common.actions,
      cell: ({ row }) => <UserActions user={row.original} />,
    },
  ];
}

export function UsersTable() {
  const { t } = useAdminI18n();
  const { data, isLoading, isError, error } = useUsers();
  if (isLoading)
    return <p className="text-muted-foreground p-4 text-sm">{t.lists.loadingUsers}</p>;
  if (isError)
    return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;
  return (
    <DataTable
      columns={buildColumns(t)}
      data={data?.items ?? []}
      emptyMessage={t.lists.emptyUsers}
    />
  );
}
