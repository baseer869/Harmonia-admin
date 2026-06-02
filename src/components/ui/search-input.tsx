import * as React from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Search / filter input (boxed) — design system: 44px tall, 2px #C2C2C2
 * border, ~371px wide. Used in listing-card filter rows.
 */
export function SearchInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <div className={cn('relative w-full sm:w-[371px] sm:max-w-full', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-[#9CA3AF]" />
      <input
        type="search"
        className="focus:border-primary h-11 w-full rounded-lg border-2 border-[#C2C2C2] bg-transparent pr-3 pl-11 text-[15px] text-foreground outline-none transition-colors placeholder:text-[#9CA3AF]"
        {...props}
      />
    </div>
  );
}
