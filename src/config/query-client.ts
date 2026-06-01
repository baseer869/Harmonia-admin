import { QueryClient } from '@tanstack/react-query';

/** Factory so server (per-request) and client get isolated caches. */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
