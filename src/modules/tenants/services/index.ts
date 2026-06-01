import { assertCan, resolveTenantContext } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { slugify } from '@/lib/utils';
import type { Actor, Paginated } from '@/types';

import { tenantRepository } from '../repository';
import {
  createTenantSchema,
  listTenantsQuerySchema,
  tenantProfileSchema,
  updateTenantSchema,
  type CreateTenantInput,
  type ListTenantsQuery,
  type TenantProfileInput,
  type UpdateTenantInput,
} from '../validation';
import type { Tenant } from '../types';

/**
 * Tenants · service (application/domain logic).
 *
 * Every method takes the current `Actor` and enforces, in order:
 *   1. RBAC (can this role perform this action?) via `assertCan`.
 *   2. Tenant isolation via `resolveTenantContext` for tenant-scoped reads.
 * Then it delegates persistence to the repository. It NEVER touches Prisma.
 *
 * Creating tenants is a SUPER_ADMIN (Harmonia) capability: the platform
 * onboards tenants and can manage their catalog/data on their behalf.
 */
/** Normalise optional form strings: '' / undefined → null for storage. */
function emptyToNull(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export const tenantService = {
  async list(actor: Actor, query: ListTenantsQuery): Promise<Paginated<Tenant>> {
    // Only cross-tenant roles can enumerate all tenants.
    assertCan(actor, 'read', 'tenant');
    if (actor.role !== 'SUPER_ADMIN') {
      throw ApiError.forbidden('Only Super Admin can list all tenants.');
    }

    const { page, pageSize, search } = listTenantsQuerySchema.parse(query);
    const { items, total } = await tenantRepository.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });
    return { items, total, page, pageSize };
  },

  async get(actor: Actor, id: string): Promise<Tenant> {
    assertCan(actor, 'read', 'tenant');
    // Tenant-scoped roles may only read their OWN tenant.
    const { tenantId } = resolveTenantContext(actor, id);
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw ApiError.notFound('Tenant not found.');
    return tenant;
  },

  async create(actor: Actor, input: CreateTenantInput): Promise<Tenant> {
    assertCan(actor, 'create', 'tenant'); // SUPER_ADMIN only (per matrix)

    const data = createTenantSchema.parse(input);
    const slug = data.slug ?? slugify(data.name);

    if (await tenantRepository.findBySlug(slug)) {
      throw ApiError.badRequest(`Slug "${slug}" is already taken.`);
    }

    return tenantRepository.create({
      name: data.name,
      slug,
      status: data.status,
    });
  },

  async update(
    actor: Actor,
    id: string,
    input: UpdateTenantInput,
  ): Promise<Tenant> {
    assertCan(actor, 'update', 'tenant');
    // Tenant admins may only update their own tenant.
    const { tenantId } = resolveTenantContext(actor, id);

    const data = updateTenantSchema.parse(input);

    if (data.slug) {
      const existing = await tenantRepository.findBySlug(data.slug);
      if (existing && existing.id !== tenantId) {
        throw ApiError.badRequest(`Slug "${data.slug}" is already taken.`);
      }
    }

    return tenantRepository.update(tenantId, data);
  },

  /**
   * The actor's OWN tenant (self-service profile view). Tenant-scoped roles
   * resolve to their session tenant; a Super Admin resolves to the active
   * tenant they are impersonating.
   */
  async getCurrent(actor: Actor): Promise<Tenant> {
    const { tenantId } = resolveTenantContext(actor, actor.tenantId);
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw ApiError.notFound('Tenant not found.');
    return tenant;
  },

  /** Update the actor's own tenant profile (no slug/status changes here). */
  async updateProfile(
    actor: Actor,
    input: TenantProfileInput,
  ): Promise<Tenant> {
    assertCan(actor, 'update', 'tenant');
    const { tenantId } = resolveTenantContext(actor, actor.tenantId);
    const data = tenantProfileSchema.parse(input);
    return tenantRepository.update(tenantId, {
      name: data.name,
      description: emptyToNull(data.description),
      contactEmail: emptyToNull(data.contactEmail),
      contactPhone: emptyToNull(data.contactPhone),
      logoUrl: emptyToNull(data.logoUrl),
    });
  },

  async archive(actor: Actor, id: string): Promise<Tenant> {
    // Deactivating a tenant is a platform-level action.
    assertCan(actor, 'delete', 'tenant'); // SUPER_ADMIN only
    return tenantRepository.update(id, { status: 'ARCHIVED' });
  },
};
