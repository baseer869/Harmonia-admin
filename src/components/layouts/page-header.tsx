import * as React from 'react';
import type { Route } from 'next';

import { cn } from '@/lib/utils';
import { BackButton } from './back-button';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  /** Show the solid-black back arrow beside the title (default: true). */
  showBack?: boolean;
  /** Explicit back target; defaults to history back when omitted. */
  backHref?: Route;
  children?: React.ReactNode;
}

/** Standard page title block used by every route. */
export function PageHeader({
  title,
  description,
  actions,
  className,
  showBack = true,
  backHref,
  children,
}: PageHeaderProps) {
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
            <h1 className="page-title">{title}</h1>
            {description ? (
              <p className="text-muted-foreground max-w-2xl text-[13px]">
                {description}
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
