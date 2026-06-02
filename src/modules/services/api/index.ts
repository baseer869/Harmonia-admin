import type { Actor, Paginated } from '@/types';

import { publicServiceCatalog, serviceCatalogService } from '../services';
import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from '../validation';
import type { Service } from '../types';

/**
 * Services · API (module public contract). Framework-agnostic seam: takes an
 * explicit `Actor`, returns plain domain objects. The only surface routes and
 * Server Components may call.
 */
export const serviceApi = {
  list(actor: Actor, query: ListServicesQuery): Promise<Paginated<Service>> {
    return serviceCatalogService.list(actor, query);
  },
  get(actor: Actor, id: string): Promise<Service> {
    return serviceCatalogService.get(actor, id);
  },
  create(
    actor: Actor,
    input: CreateServiceInput,
    targetTenantId?: string,
  ): Promise<Service> {
    return serviceCatalogService.create(actor, input, targetTenantId);
  },
  update(
    actor: Actor,
    id: string,
    input: UpdateServiceInput,
  ): Promise<Service> {
    return serviceCatalogService.update(actor, id, input);
  },
  remove(actor: Actor, id: string): Promise<void> {
    return serviceCatalogService.remove(actor, id);
  },
};

/** Public catalog API (no auth) — consumed by the client website. */
export const publicServiceApi = {
  list(tenantSlug: string, query: ListServicesQuery): Promise<Paginated<Service>> {
    return publicServiceCatalog.list(tenantSlug, query);
  },
  getBySlug(tenantSlug: string, serviceSlug: string): Promise<Service> {
    return publicServiceCatalog.getBySlug(tenantSlug, serviceSlug);
  },
};
