'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { http } from '@/lib/api';
import type { Paginated } from '@/types';

import type { Tenant } from '../types';
import type {
  CreateTenantInput,
  ListTenantsQuery,
  UpdateTenantInput,
} from '../validation';

/**
 * Tenants · client hooks (TanStack Query over the route handlers).
 *
 * Client code talks HTTP to `/api/tenants` — it never imports the service or
 * repository. When the backend is extracted, only `lib/api/http` base URL
 * changes; these hooks stay identical.
 */
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (query: Partial<ListTenantsQuery>) =>
    [...tenantKeys.lists(), query] as const,
  detail: (id: string) => [...tenantKeys.all, 'detail', id] as const,
};

function toQueryString(query?: Partial<ListTenantsQuery>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useTenants(query?: Partial<ListTenantsQuery>) {
  return useQuery({
    queryKey: tenantKeys.list(query ?? {}),
    queryFn: () =>
      http.get<Paginated<Tenant>>(`/api/tenants${toQueryString(query)}`),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => http.get<Tenant>(`/api/tenants/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) =>
      http.post<Tenant>('/api/tenants', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.lists() }),
  });
}

export function useUpdateTenant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantInput) =>
      http.patch<Tenant>(`/api/tenants/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.lists() });
      qc.invalidateQueries({ queryKey: tenantKeys.detail(id) });
    },
  });
}

export function useArchiveTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete<Tenant>(`/api/tenants/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.lists() }),
  });
}
