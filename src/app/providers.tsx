'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { makeQueryClient } from '@/config';

/** Client providers (TanStack Query, theme, etc.) wrapping the whole app. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
