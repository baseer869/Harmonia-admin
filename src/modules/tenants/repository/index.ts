import { prisma } from '@/lib/db';
import type { Tenant as PrismaTenant } from '@prisma/client';

import type { Tenant, TenantStatus } from '../types';

/**
 * Tenants · repository (data access).
 *
 * The ONLY layer permitted to import the Prisma client. Exposes a narrow,
 * persistence-agnostic interface so the service layer (and the future backend)
 * never depends on Prisma directly.
 *
 * NB: `Tenant` is the platform root aggregate and is therefore NOT tenant-
 * scoped itself. Tenant-OWNED repositories (services, customers, …) take a
 * `tenantId` on every method and always filter by it — that is where row-level
 * isolation is applied.
 */

export interface ListTenantsArgs {
  skip: number;
  take: number;
  search?: string;
}

export interface CreateTenantData {
  name: string;
  slug: string;
  status: TenantStatus;
  defaultCurrency?: string;
  defaultLocale?: string;
  timezone?: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export interface UpdateTenantData {
  name?: string;
  slug?: string;
  status?: TenantStatus;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
}

export interface TenantRepository {
  findMany(args: ListTenantsArgs): Promise<{ items: Tenant[]; total: number }>;
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  create(data: CreateTenantData): Promise<Tenant>;
  update(id: string, data: UpdateTenantData): Promise<Tenant>;
}

function toDomain(row: PrismaTenant): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    description: row.description,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    logoUrl: row.logoUrl,
    coverUrl: row.coverUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

class PrismaTenantRepository implements TenantRepository {
  async findMany({ skip, take, search }: ListTenantsArgs) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    return { items: rows.map(toDomain), total };
  }

  async findById(id: string) {
    const row = await prisma.tenant.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: string) {
    const row = await prisma.tenant.findUnique({ where: { slug } });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateTenantData) {
    const row = await prisma.tenant.create({ data });
    return toDomain(row);
  }

  async update(id: string, data: UpdateTenantData) {
    const row = await prisma.tenant.update({ where: { id }, data });
    return toDomain(row);
  }
}

/** Singleton repository instance injected into the service layer. */
export const tenantRepository: TenantRepository = new PrismaTenantRepository();
