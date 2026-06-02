'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/lib/api';
import type { Actor } from '@/types';

import type { AuthUser } from '../types';
import type { AdminLoginInput } from '../validation';

/** Auth · client hooks for the back-office (admin) session. */
export const authKeys = {
  me: ['auth', 'me'] as const,
};

/** Current admin principal, or null when signed out. */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => http.get<Actor>('/api/admin/auth/me'),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminLoginInput) =>
      http.post<AuthUser>('/api/admin/auth/login', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http.post<{ success: boolean }>('/api/admin/auth/logout'),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me }),
  });
}
