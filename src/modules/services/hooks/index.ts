'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { http } from '@/lib/api';
import type { Paginated } from '@/types';

import type { Service } from '../types';
import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from '../validation';

/** Services · client hooks (TanStack Query over `/api/services`). */
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (query: Partial<ListServicesQuery>) =>
    [...serviceKeys.lists(), query] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
};

function toQueryString(query?: Partial<ListServicesQuery>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  if (query.tenantId) params.set('tenantId', query.tenantId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useServices(query?: Partial<ListServicesQuery>) {
  return useQuery({
    queryKey: serviceKeys.list(query ?? {}),
    queryFn: () =>
      http.get<Paginated<Service>>(`/api/services${toQueryString(query)}`),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) =>
      http.post<Service>('/api/services', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.lists() }),
  });
}

export function useUpdateService(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateServiceInput) =>
      http.patch<Service>(`/api/services/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete<void>(`/api/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.lists() }),
  });
}
