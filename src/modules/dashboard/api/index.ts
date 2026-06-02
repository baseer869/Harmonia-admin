import type { Actor } from '@/types';

import { dashboardService } from '../services';
import type { DashboardStats } from '../types';

/** Dashboard · API (module public contract). */
export const dashboardApi = {
  getStats(actor: Actor): Promise<DashboardStats> {
    return dashboardService.getStats(actor);
  },
};
