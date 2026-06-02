import * as React from 'react';

import { Card, CardContent } from '@/components/ui';

/**
 * Listing wrapper (the "X Listing" card from the reference): a titled card with
 * a filters row, optional tabs, then the table/content.
 */
export function ListingCard({
  title,
  filters,
  tabs,
  children,
}: {
  title: string;
  filters?: React.ReactNode;
  tabs?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <h2 className="section-title text-primary">{title}</h2>
        {filters ? (
          <div className="flex flex-wrap items-center gap-2">{filters}</div>
        ) : null}
      </div>
      {tabs ? <div className="px-6 pb-4">{tabs}</div> : null}
      <CardContent className="px-2 pb-2">{children}</CardContent>
    </Card>
  );
}

/** Simple pill tab group (Active / Past style). */
export function ListingTabs({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            o.value === value
              ? 'bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-sm font-medium'
              : 'text-muted-foreground hover:bg-accent rounded-full px-4 py-1.5 text-sm font-medium'
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
