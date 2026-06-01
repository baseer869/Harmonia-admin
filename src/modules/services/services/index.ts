import { assertCan, resolveTenantContext } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { slugify } from '@/lib/utils';
import type { Actor, Paginated } from '@/types';

import { serviceRepository } from '../repository';
import {
  createServiceSchema,
  listServicesQuerySchema,
  updateServiceSchema,
  type CreateServiceInput,
  type ListServicesQuery,
  type UpdateServiceInput,
} from '../validation';
import type { Service } from '../types';

/**
 * Services · service layer.
 *
 * Tenant-self-service catalog. Resolves an authorised `tenantId` for every
 * call via `resolveTenantContext`, then hands it to the tenant-scoped
 * repository. A Tenant Admin manages only their own catalog; a Super Admin can
 * manage any tenant's catalog on their behalf by targeting that tenant.
 */
export const serviceCatalogService = {
  async list(
    actor: Actor,
    query: ListServicesQuery,
  ): Promise<Paginated<Service>> {
    assertCan(actor, 'read', 'service');
    const { page, pageSize, search, tenantId } =
      listServicesQuerySchema.parse(query);
    // Super Admin may target a tenant; tenant roles are pinned to their own.
    const ctx = resolveTenantContext(actor, tenantId ?? actor.tenantId);

    const { items, total } = await serviceRepository.findMany({
      tenantId: ctx.tenantId,
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });
    return { items, total, page, pageSize };
  },

  async get(actor: Actor, id: string): Promise<Service> {
    assertCan(actor, 'read', 'service');
    const ctx = resolveTenantContext(actor, actor.tenantId);
    const service = await serviceRepository.findById(ctx.tenantId, id);
    if (!service) throw ApiError.notFound('Service not found.');
    return service;
  },

  async create(
    actor: Actor,
    input: CreateServiceInput,
    targetTenantId?: string,
  ): Promise<Service> {
    assertCan(actor, 'create', 'service');
    const ctx = resolveTenantContext(actor, targetTenantId ?? actor.tenantId);

    const data = createServiceSchema.parse(input);
    const slug = data.slug ?? slugify(data.title);

    if (await serviceRepository.findBySlug(ctx.tenantId, slug)) {
      throw ApiError.badRequest(`Slug "${slug}" already exists for this tenant.`);
    }

    return serviceRepository.create(ctx.tenantId, {
      slug,
      title: data.title,
      description: data.description ?? null,
      priceCents: data.priceCents,
      currency: data.currency,
      active: data.active,
    });
  },

  async update(
    actor: Actor,
    id: string,
    input: UpdateServiceInput,
  ): Promise<Service> {
    assertCan(actor, 'update', 'service');
    const ctx = resolveTenantContext(actor, actor.tenantId);
    const data = updateServiceSchema.parse(input);

    const updated = await serviceRepository.update(ctx.tenantId, id, {
      ...data,
      description:
        data.description === undefined ? undefined : data.description ?? null,
    });
    if (!updated) throw ApiError.notFound('Service not found.');
    return updated;
  },

  async remove(actor: Actor, id: string): Promise<void> {
    assertCan(actor, 'delete', 'service');
    const ctx = resolveTenantContext(actor, actor.tenantId);
    const ok = await serviceRepository.remove(ctx.tenantId, id);
    if (!ok) throw ApiError.notFound('Service not found.');
  },
};
