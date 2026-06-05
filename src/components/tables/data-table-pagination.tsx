'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useAdminI18n } from '@/lib/i18n/provider';

/** Server-side pagination state shared by every list table. */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const navBtn =
  'inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40';

/**
 * One reusable pager + record label for all admin tables. Rendered by DataTable
 * when a `pagination` prop is supplied, so every table shares the same UX.
 */
export function DataTablePagination({ page, pageSize, total, onPageChange }: PaginationState) {
  const { t } = useAdminI18n();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <p className="text-muted-foreground text-sm">
        {t.common.showing}{' '}
        <span className="text-foreground font-medium tabular-nums">{from}–{to}</span> {t.common.of}{' '}
        <span className="text-foreground font-medium tabular-nums">{total}</span> {t.common.results}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={navBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" /> {t.common.previous}
        </button>
        <span className="text-muted-foreground px-1 text-sm tabular-nums">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          className={navBtn}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          {t.common.next} <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
