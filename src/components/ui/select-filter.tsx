import * as React from 'react';
import { ChevronDown, ListFilter } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Boxed select filter (e.g. "Sort by Status") matching the search-input style. */
export function SelectFilter({
  options,
  className,
  ...props
}: React.ComponentProps<'select'> & {
  options: { value: string; label: string }[];
}) {
  return (
    <div className={cn('relative', className)}>
      <ListFilter className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#9CA3AF]" />
      <select
        className="focus:border-primary text-foreground h-11 appearance-none rounded-lg border-2 border-[#C2C2C2] bg-transparent pr-9 pl-10 text-[15px] outline-none"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#9CA3AF]" />
    </div>
  );
}
