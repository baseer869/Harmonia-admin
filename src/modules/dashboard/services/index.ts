import { resolveTenantContext } from '@/lib/auth';
import type { Actor } from '@/types';

import { dashboardRepository } from '../repository';
import type { DashboardStats } from '../types';

/** Dashboard · service. Platform-wide stats for Super Admin; tenant-scoped otherwise. */
export const dashboardService = {
  async getStats(actor: Actor): Promise<DashboardStats> {
    if (actor.role === 'SUPER_ADMIN') {
      return dashboardRepository.platformStats();
    }
    const { tenantId } = resolveTenantContext(actor, actor.tenantId);
    return dashboardRepository.tenantStats(tenantId);
  },
};
