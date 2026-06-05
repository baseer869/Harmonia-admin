'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { DataTable, TABLE_PAGE_SIZE } from '@/components/tables';
import { useAdminI18n } from '@/lib/i18n/provider';

import { useOwnerRequests, useUpdateOwnerRequestStatus } from '../hooks';
import type { OwnerRequest, OwnerRequestStatus } from '../types';
import { OwnerRequestDetail } from './owner-request-detail';

type Dict = ReturnType<typeof useAdminI18n>['t'];

const STATUSES: OwnerRequestStatus[] = ['NEW', 'REVIEWING', 'APPROVED', 'REJECTED', 'CONVERTED'];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/** Inline status changer — lets an admin triage a lead without a modal. */
function StatusSelect({ req }: { req: OwnerRequest }) {
  const { t } = useAdminI18n();
  const update = useUpdateOwnerRequestStatus();
  return (
    <select
      value={req.status}
      disabled={update.isPending}
      onChange={(e) =>
        update.mutate({ id: req.id, status: e.target.value as OwnerRequestStatus })
      }
      className="border-input bg-background h-8 rounded-md border px-2 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {t.ownerReq[`status${s}`] ?? s}
        </option>
      ))}
    </select>
  );
}

function buildColumns(t: Dict, onView: (r: OwnerRequest) => void): ColumnDef<OwnerRequest>[] {
  return [
    {
      accessorKey: 'firstName',
      header: t.common.name,
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName ?? ''}`.trim(),
    },
    { accessorKey: 'email', header: t.common.email },
    { accessorKey: 'phone', header: t.common.phone, cell: ({ row }) => row.original.phone ?? '—' },
    {
      accessorKey: 'company',
      header: t.ownerReq.business,
      cell: ({ row }) => row.original.company ?? '—',
    },
    {
      accessorKey: 'subject',
      header: t.ownerReq.subject,
      cell: ({ row }) => row.original.subject ?? '—',
    },
    { id: 'status', header: t.common.status, cell: ({ row }) => <StatusSelect req={row.original} /> },
    {
      accessorKey: 'createdAt',
      header: t.ownerReq.requestedOn,
      cell: ({ row }) => fmtDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: t.common.actions,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original)}
          className="text-primary/80 hover:text-primary transition-colors"
          aria-label="View request"
        >
          <Eye className="size-4" />
        </button>
      ),
    },
  ];
}

export function OwnerRequestsTable({
  status,
  search,
}: {
  status?: OwnerRequestStatus;
  search?: string;
}) {
  const { t } = useAdminI18n();
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status, search]);
  const { data, isLoading, isError, error } = useOwnerRequests({
    status,
    search,
    page,
    pageSize: TABLE_PAGE_SIZE,
  });
  const [view, setView] = useState<OwnerRequest | null>(null);

  if (isLoading) return <p className="text-muted-foreground p-4 text-sm">{t.common.loading}</p>;
  if (isError) return <p className="text-destructive p-4 text-sm">{(error as Error).message}</p>;

  return (
    <>
      <DataTable
        columns={buildColumns(t, setView)}
        data={data?.items ?? []}
        emptyMessage={t.ownerReq.empty}
        pagination={
          data
            ? { page: data.page, pageSize: data.pageSize, total: data.total, onPageChange: setPage }
            : undefined
        }
      />
      <OwnerRequestDetail request={view} open={view !== null} onClose={() => setView(null)} />
    </>
  );
}
