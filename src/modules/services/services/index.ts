import { assertCan, resolveTenantContext } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { prisma } from '@/lib/db';
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
 * Services · service layer (tenant-scoped catalog). For a Super Admin with no
 * active tenant we default to the sole tenant (single-tenant operating model);
 * tenant roles are always pinned to their own.
 */
async function scopeTenant(actor: Actor, explicit?: string | null): Promise<string> {
  if (actor.role === 'SUPER_ADMIN') {
    if (explicit) return explicit;
    if (actor.tenantId) return actor.tenantId;
    const t = await prisma.tenant.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!t) throw ApiError.badRequest('No tenant exists yet. Onboard a tenant first.');
    return t.id;
  }
  return resolveTenantContext(actor, explicit ?? actor.tenantId).tenantId;
}

export const serviceCatalogService = {
  async list(actor: Actor, query: ListServicesQuery): Promise<Paginated<Service>> {
    assertCan(actor, 'read', 'service');
    const { page, pageSize, search, tenantId } = listServicesQuerySchema.parse(query);
    const scope = await scopeTenant(actor, tenantId);
    const { items, total } = await serviceRepository.findMany({
      tenantId: scope,
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });
    return { items, total, page, pageSize };
  },

  async get(actor: Actor, id: string): Promise<Service> {
    assertCan(actor, 'read', 'service');
    const scope = await scopeTenant(actor);
    const service = await serviceRepository.findById(scope, id);
    if (!service) throw ApiError.notFound('Service not found.');
    return service;
  },

  async create(
    actor: Actor,
    input: CreateServiceInput,
    targetTenantId?: string,
  ): Promise<Service> {
    assertCan(actor, 'create', 'service');
    const scope = await scopeTenant(actor, targetTenantId);
    const d = createServiceSchema.parse(input);
    const slug = d.slug ?? slugify(d.title);

    if (await serviceRepository.findBySlug(scope, slug)) {
      throw ApiError.badRequest(`Slug "${slug}" already exists for this tenant.`);
    }

    return serviceRepository.create(scope, {
      categoryId: d.categoryId ?? null,
      type: d.type,
      slug,
      title: d.title,
      subtitle: d.subtitle ?? null,
      description: d.description ?? null,
      tags: d.tags,
      coverUrl: d.coverUrl || null,
      thumbUrl: d.thumbUrl || null,
      priceMode: d.priceMode,
      priceCents: d.priceCents,
      currency: d.currency,
      acceptedCurrencies: d.acceptedCurrencies,
      priceUnit: d.priceUnit ?? null,
      requiresDate: d.requiresDate,
      minPeople: d.minPeople ?? null,
      maxPeople: d.maxPeople ?? null,
      durationMinutes: d.durationMinutes ?? null,
      languages: d.languages,
      active: d.active,
      featured: d.featured,
      options: d.options,
      extras: d.extras,
      included: d.included,
      info: d.info,
    });
  },

  async update(actor: Actor, id: string, input: UpdateServiceInput): Promise<Service> {
    assertCan(actor, 'update', 'service');
    const scope = await scopeTenant(actor);
    // The edit wizard submits the full shape → full replace.
    const d = createServiceSchema.parse(input);
    const slug = d.slug ?? slugify(d.title);
    const clash = await serviceRepository.findBySlug(scope, slug);
    if (clash && clash.id !== id) {
      throw ApiError.badRequest(`Slug "${slug}" already exists for this tenant.`);
    }
    const updated = await serviceRepository.update(scope, id, {
      categoryId: d.categoryId ?? null,
      type: d.type,
      slug,
      title: d.title,
      subtitle: d.subtitle ?? null,
      description: d.description ?? null,
      tags: d.tags,
      coverUrl: d.coverUrl || null,
      thumbUrl: d.thumbUrl || null,
      priceMode: d.priceMode,
      priceCents: d.priceCents,
      currency: d.currency,
      acceptedCurrencies: d.acceptedCurrencies,
      priceUnit: d.priceUnit ?? null,
      requiresDate: d.requiresDate,
      minPeople: d.minPeople ?? null,
      maxPeople: d.maxPeople ?? null,
      durationMinutes: d.durationMinutes ?? null,
      languages: d.languages,
      active: d.active,
      featured: d.featured,
      options: d.options,
      extras: d.extras,
      included: d.included,
      info: d.info,
    });
    if (!updated) throw ApiError.notFound('Service not found.');
    return updated;
  },

  async remove(actor: Actor, id: string): Promise<void> {
    assertCan(actor, 'delete', 'service');
    const scope = await scopeTenant(actor);
    const ok = await serviceRepository.remove(scope, id);
    if (!ok) throw ApiError.notFound('Service not found.');
  },
};

/**
 * Public catalog read (no auth). Tenant resolved by slug (sent by the client
 * website); only ACTIVE services of an ACTIVE tenant are exposed.
 */
export const publicServiceCatalog = {
  async list(tenantSlug: string, query: ListServicesQuery): Promise<Paginated<Service>> {
    const tenantId = await serviceRepository.tenantIdBySlug(tenantSlug);
    if (!tenantId) throw ApiError.notFound('Unknown tenant.');
    const { page, pageSize, search } = listServicesQuerySchema.parse(query);
    const { items, total } = await serviceRepository.findManyActive({
      tenantId,
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });
    return { items, total, page, pageSize };
  },

  async getBySlug(tenantSlug: string, serviceSlug: string): Promise<Service> {
    const tenantId = await serviceRepository.tenantIdBySlug(tenantSlug);
    if (!tenantId) throw ApiError.notFound('Unknown tenant.');
    const svc = await serviceRepository.findActiveBySlug(tenantId, serviceSlug);
    if (!svc) throw ApiError.notFound('Service not found.');
    return svc;
  },
};
