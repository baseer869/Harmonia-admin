import { assertCan, resolveTenantContext } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { prisma } from '@/lib/db';
import type { Actor, Paginated } from '@/types';

import { serviceRepository } from '../repository';
import type { ServiceLocaleFields } from '../types';
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

type Translations = Record<string, ServiceLocaleFields>;

/** The locale to derive the slug + base option/extra names from (prefer en). */
function primaryLocaleOf(tr: Translations): string {
  const titled = (l: string) => Boolean(tr[l]?.title?.trim());
  if (titled('en')) return 'en';
  if (titled('fr')) return 'fr';
  return Object.keys(tr).find(titled) ?? Object.keys(tr)[0] ?? 'en';
}

/** Map a validated input into the repository's create/update shape. */
function toRepoData(d: CreateServiceInput, slug: string) {
  const tr = d.translations as Translations;
  const primary = primaryLocaleOf(tr);
  return {
    categoryId: d.categoryId ?? null,
    type: d.type,
    slug,
    coverUrl: d.coverUrl || null,
    thumbUrl: d.thumbUrl || null,
    priceMode: d.priceMode,
    priceCents: d.priceCents,
    currency: d.currency,
    acceptedCurrencies: d.acceptedCurrencies,
    requiresDate: d.requiresDate,
    minPeople: d.minPeople ?? null,
    maxPeople: d.maxPeople ?? null,
    durationMinutes: d.durationMinutes ?? null,
    languages: d.languages,
    active: d.active,
    featured: d.featured,
    // Base name = the primary locale's name (booking-matching key + fallback).
    options: d.options.map((o, i) => ({
      name: tr[primary]?.options?.[i]?.name?.trim() || o.name,
      priceDeltaCents: o.priceDeltaCents,
    })),
    extras: d.extras.map((e, i) => ({
      name: tr[primary]?.extras?.[i]?.name?.trim() || e.name,
      priceCents: e.priceCents,
    })),
    translations: tr,
  };
}

/**
 * Read/by-id scope. Unlike `scopeTenant` (which must return a concrete tenant
 * for creation), this returns `undefined` for a SUPER_ADMIN so they see/operate
 * across ALL tenants — a tenant role stays locked to its own tenant.
 */
function readScope(actor: Actor, explicit?: string | null): string | undefined {
  if (actor.role === 'SUPER_ADMIN') return explicit ?? undefined;
  return resolveTenantContext(actor, explicit ?? actor.tenantId).tenantId;
}

export const serviceCatalogService = {
  async list(actor: Actor, query: ListServicesQuery): Promise<Paginated<Service>> {
    assertCan(actor, 'read', 'service');
    const { page, pageSize, search, tenantId, locale } = listServicesQuerySchema.parse(query);
    const scope = readScope(actor, tenantId);
    const { items, total } = await serviceRepository.findMany({
      tenantId: scope,
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
      locale,
    });
    return { items, total, page, pageSize };
  },

  async get(actor: Actor, id: string, locale?: string): Promise<Service> {
    assertCan(actor, 'read', 'service');
    const service = await serviceRepository.findById(readScope(actor), id, locale);
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
    const primary = primaryLocaleOf(d.translations as Translations);
    const slug = d.slug ?? slugify((d.translations as Translations)[primary]?.title ?? '');

    if (await serviceRepository.findBySlug(scope, slug)) {
      throw ApiError.badRequest(`Slug "${slug}" already exists for this tenant.`);
    }

    return serviceRepository.create(scope, toRepoData(d, slug));
  },

  async update(actor: Actor, id: string, input: UpdateServiceInput): Promise<Service> {
    assertCan(actor, 'update', 'service');
    // Resolve the service (and its own tenant) within the caller's read scope.
    const existing = await serviceRepository.findById(readScope(actor), id);
    if (!existing) throw ApiError.notFound('Service not found.');
    const scope = existing.tenantId;
    // The edit wizard submits the full shape → full replace.
    const d = createServiceSchema.parse(input);
    const primary = primaryLocaleOf(d.translations as Translations);
    const slug = d.slug ?? slugify((d.translations as Translations)[primary]?.title ?? '');
    const clash = await serviceRepository.findBySlug(scope, slug);
    if (clash && clash.id !== id) {
      throw ApiError.badRequest(`Slug "${slug}" already exists for this tenant.`);
    }
    const updated = await serviceRepository.update(scope, id, toRepoData(d, slug));
    if (!updated) throw ApiError.notFound('Service not found.');
    return updated;
  },

  async remove(actor: Actor, id: string): Promise<void> {
    assertCan(actor, 'delete', 'service');
    const ok = await serviceRepository.remove(readScope(actor), id);
    if (!ok) throw ApiError.notFound('Service not found.');
  },
};

/**
 * Public catalog read (no auth). Tenant resolved by slug (sent by the client
 * website); only ACTIVE services of an ACTIVE tenant are exposed.
 */
export const publicServiceCatalog = {
  async list(
    tenantSlug: string,
    query: ListServicesQuery,
    locale?: string,
  ): Promise<Paginated<Service>> {
    const tenantId = await serviceRepository.tenantIdBySlug(tenantSlug);
    if (!tenantId) throw ApiError.notFound('Unknown tenant.');
    const { page, pageSize, search } = listServicesQuerySchema.parse(query);
    const { items, total } = await serviceRepository.findManyActive({
      tenantId,
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
      locale,
    });
    return { items, total, page, pageSize };
  },

  async getBySlug(tenantSlug: string, serviceSlug: string, locale?: string): Promise<Service> {
    const tenantId = await serviceRepository.tenantIdBySlug(tenantSlug);
    if (!tenantId) throw ApiError.notFound('Unknown tenant.');
    const svc = await serviceRepository.findActiveBySlug(tenantId, serviceSlug, locale);
    if (!svc) throw ApiError.notFound('Service not found.');
    return svc;
  },
};
