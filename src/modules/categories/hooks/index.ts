'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import type { Paginated } from '@/types';
import type { Category } from '../types';
import type { CreateCategoryInput, ListCategoriesQuery } from '../validation';
export const categoryKeys = { all: ['categories'] as const, list: (q: Partial<ListCategoriesQuery>) => [...categoryKeys.all, 'list', q] as const };
function qs(q?: Partial<ListCategoriesQuery>) { if (!q) return ''; const p = new URLSearchParams(); if (q.search) p.set('search', q.search); if (q.tenantId) p.set('tenantId', q.tenantId); const s = p.toString(); return s ? `?${s}` : ''; }
export function useCategories(query?: Partial<ListCategoriesQuery>) {
  return useQuery({ queryKey: categoryKeys.list(query ?? {}), queryFn: () => http.get<Paginated<Category>>(`/api/categories${qs(query)}`) });
}
export function useCreateCategory() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => http.post<Category>('/api/categories', input),
    onSuccess: () => c.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
