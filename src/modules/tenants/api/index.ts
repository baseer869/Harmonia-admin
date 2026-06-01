import type { Actor, Paginated } from '@/types';

import { tenantService } from '../services';
import type {
  CreateTenantInput,
  ListTenantsQuery,
  TenantProfileInput,
  UpdateTenantInput,
} from '../validation';
import type { Tenant } from '../types';

/**
 * Tenants · API (module public contract / application boundary).
 *
 * This is the ONLY tenant surface that routes, route handlers and Server
 * Components may call. It is framework-agnostic (takes an explicit `Actor`,
 * returns plain domain objects), which is precisely the seam that lets the
 * whole module be lifted into a standalone backend later: swap these
 * implementations to call a remote service and nothing upstream changes.
 */
export const tenantApi = {
  list(actor: Actor, query: ListTenantsQuery): Promise<Paginated<Tenant>> {
    return tenantService.list(actor, query);
  },
  get(actor: Actor, id: string): Promise<Tenant> {
    return tenantService.get(actor, id);
  },
  create(actor: Actor, input: CreateTenantInput): Promise<Tenant> {
    return tenantService.create(actor, input);
  },
  update(actor: Actor, id: string, input: UpdateTenantInput): Promise<Tenant> {
    return tenantService.update(actor, id, input);
  },
  getCurrent(actor: Actor): Promise<Tenant> {
    return tenantService.getCurrent(actor);
  },
  updateProfile(actor: Actor, input: TenantProfileInput): Promise<Tenant> {
    return tenantService.updateProfile(actor, input);
  },
  archive(actor: Actor, id: string): Promise<Tenant> {
    return tenantService.archive(actor, id);
  },
};
