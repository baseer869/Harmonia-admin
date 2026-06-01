'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/lib/api';
import type { Tenant, TenantProfileInput } from '@/modules/tenants';

/**
 * Settings · client hooks for tenant profile self-service.
 * Talks to `/api/profile`, which composes the tenants module.
 */
export const settingsKeys = {
  profile: ['settings', 'profile'] as const,
};

export function useTenantProfile() {
  return useQuery({
    queryKey: settingsKeys.profile,
    queryFn: () => http.get<Tenant>('/api/profile'),
  });
}

export function useUpdateTenantProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TenantProfileInput) =>
      http.patch<Tenant>('/api/profile', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.profile }),
  });
}
