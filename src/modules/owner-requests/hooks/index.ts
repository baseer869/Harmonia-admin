'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/lib/api';
import type { Paginated } from '@/types';

import type { OwnerRequest, OwnerRequestStatus } from '../types';
import type { ListOwnerRequestsQuery } from '../validation';

export const ownerRequestKeys = {
  all: ['owner-requests'] as const,
  list: (q: Partial<ListOwnerRequestsQuery>) => [...ownerRequestKeys.all, 'list', q] as const,
};

function qs(q?: Partial<ListOwnerRequestsQuery>) {
  if (!q) return '';
  const p = new URLSearchParams();
  if (q.page) p.set('page', String(q.page));
  if (q.pageSize) p.set('pageSize', String(q.pageSize));
  if (q.status) p.set('status', q.status);
  if (q.search) p.set('search', q.search);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function useOwnerRequests(query?: Partial<ListOwnerRequestsQuery>) {
  return useQuery({
    queryKey: ownerRequestKeys.list(query ?? {}),
    queryFn: () => http.get<Paginated<OwnerRequest>>(`/api/owner-requests${qs(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateOwnerRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OwnerRequestStatus }) =>
      http.patch<OwnerRequest>(`/api/owner-requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ownerRequestKeys.all }),
  });
}
