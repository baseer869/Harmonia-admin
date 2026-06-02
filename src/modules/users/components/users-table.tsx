'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil } from 'lucide-react';

import { Switch } from '@/components/ui';
import { DataTable } from '@/components/tables';

import { useUpdateUser, useUsers } from '../hooks';
import type { AdminUser } from '../types';

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

const columns: ColumnDef<AdminUser>[] = [
  {
    id: 'rowId',
    header: 'ID',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.index + 1}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.original.name ?? '—',
  },
  { accessorKey: 'email', header: 'Email ID' },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.phone ?? '—',
  },
  {
    accessorKey: 'city',
    header: 'City',
    cell: ({ row }) => row.original.city ?? '—',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];

export function UsersTable() {
  const { data, isLoading, isError, error } = useUsers();
  if (isLoading)
    return <p className="text-muted-foreground p-4 text-sm">Loading users…</p>;
  if (isError)
    return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;
  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      emptyMessage="No users yet."
    />
  );
}
