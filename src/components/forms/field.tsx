import * as React from 'react';

import { cn } from '@/lib/utils';

/** Labeled form field — label above the input (design system). */
export function Field({
  label,
  error,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-foreground block text-[13px] font-semibold">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

/** Underline-style native select to match the form Input. */
export function FieldSelect({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'focus:border-primary h-11 w-full rounded-none border-0 border-b border-[#D5D5D5] bg-transparent px-0 py-2 text-[16px] outline-none focus:border-b-2',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
