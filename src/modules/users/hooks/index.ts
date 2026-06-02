'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/lib/api';
import type { Paginated } from '@/types';

import type { AdminUser } from '../types';
import type { CreateUserInput, ListUsersQuery } from '../validation';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (q: Partial<ListUsersQuery>) => [...userKeys.lists(), q] as const,
};

function qs(query?: Partial<ListUsersQuery>): string {
  if (!query) return '';
  const p = new URLSearchParams();
  if (query.page) p.set('page', String(query.page));
  if (query.search) p.set('search', query.search);
  if (query.tenantId) p.set('tenantId', query.tenantId);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function useUsers(query?: Partial<ListUsersQuery>) {
  return useQuery({
    queryKey: userKeys.list(query ?? {}),
    queryFn: () => http.get<Paginated<AdminUser>>(`/api/users${qs(query)}`),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => http.post<AdminUser>('/api/users', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Record<string, unknown>) =>
      http.patch<AdminUser>(`/api/users/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}
