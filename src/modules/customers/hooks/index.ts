'use client';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import type { Paginated } from '@/types';
import type { Customer } from '../types';
import type { ListCustomersQuery } from '../validation';
export const customerKeys = { all: ['customers'] as const, list: (q: Partial<ListCustomersQuery>) => [...customerKeys.all, 'list', q] as const };
function qs(q?: Partial<ListCustomersQuery>) { if (!q) return ''; const p = new URLSearchParams(); if (q.page) p.set('page', String(q.page)); if (q.search) p.set('search', q.search); const s = p.toString(); return s ? `?${s}` : ''; }
export function useCustomers(query?: Partial<ListCustomersQuery>) {
  return useQuery({ queryKey: customerKeys.list(query ?? {}), queryFn: () => http.get<Paginated<Customer>>(`/api/customers${qs(query)}`), placeholderData: keepPreviousData });
}
export function useSetCustomerStatus() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'BLOCKED' }) =>
      http.patch<Customer>(`/api/customers/${id}`, { status }),
    onSuccess: () => c.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
