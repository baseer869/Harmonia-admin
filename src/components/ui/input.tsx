import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Form data input — underline style per the design system
 * (1px #D5D5D5 bottom border, gold on focus, 16px text).
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'placeholder:text-muted-foreground flex h-11 w-full min-w-0 rounded-none border-0 border-b border-[#D5D5D5] bg-transparent px-0 py-2 text-[16px] outline-none transition-colors',
        'focus:border-primary focus:border-b-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
