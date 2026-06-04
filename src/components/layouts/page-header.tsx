'use client';

import * as React from 'react';
import type { Route } from 'next';

import { cn } from '@/lib/utils';
import { useAdminI18n } from '@/lib/i18n/provider';
import { BackButton } from './back-button';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Page key for i18n (looks up `pages[tkey]`); falls back to title/description. */
  tkey?: string;
  actions?: React.ReactNode;
  className?: string;
  /**
   * Show a back arrow beside the title. OFF by default — top-level pages are
   * reached from the sidebar and a history `back()` there just cycles. Enable
   * it on sub-pages and pass an explicit `backHref` for reliable navigation.
   */
  showBack?: boolean;
  /** Explicit back target (a real link — never a history loop). */
  backHref?: Route;
  children?: React.ReactNode;
}

/** Standard page title block used by every route. */
export function PageHeader({
  title,
  description,
  tkey,
  actions,
  className,
  showBack = false,
  backHref,
  children,
}: PageHeaderProps) {
  const { t } = useAdminI18n();
  const p = tkey ? t.pages[tkey] : undefined;
  const heading = p?.title ?? title;
  const sub = p?.desc ?? description;
  return (
    <div className={cn('space-y-8', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-2">
          {showBack ? (
            <div className="pt-0.5">
              <BackButton href={backHref} />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <h1 className="page-title">{heading}</h1>
            {sub ? (
              <p className="text-muted-foreground max-w-2xl text-[13px]">
                {sub}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
