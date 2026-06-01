import { prisma } from '@/lib/db';
import type { Service as PrismaService } from '@prisma/client';

import type { Service } from '../types';

/**
 * Services · repository (tenant-scoped data access).
 *
 * THIS is where row-level tenant isolation lives: EVERY method takes a
 * `tenantId` and includes it in the `where` clause, so a query can only ever
 * see/affect rows belonging to that tenant. The service layer is responsible
 * for passing the correct, authorised `tenantId` (via `resolveTenantContext`).
 */

export interface ListServicesArgs {
  tenantId: string;
  skip: number;
  take: number;
  search?: string;
}

export interface CreateServiceData {
  slug: string;
  title: string;
  description?: string | null;
  priceCents: number;
  currency: string;
  active: boolean;
}

export interface UpdateServiceData {
  slug?: string;
  title?: string;
  description?: string | null;
  priceCents?: number;
  currency?: string;
  active?: boolean;
}

export interface ServiceRepository {
  findMany(
    args: ListServicesArgs,
  ): Promise<{ items: Service[]; total: number }>;
  findById(tenantId: string, id: string): Promise<Service | null>;
  findBySlug(tenantId: string, slug: string): Promise<Service | null>;
  create(tenantId: string, data: CreateServiceData): Promise<Service>;
  update(
    tenantId: string,
    id: string,
    data: UpdateServiceData,
  ): Promise<Service | null>;
  remove(tenantId: string, id: string): Promise<boolean>;
}

function toDomain(row: PrismaService): Service {
  return {
    id: row.id,
    tenantId: row.tenantId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    currency: row.currency,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

class PrismaServiceRepository implements ServiceRepository {
  async findMany({ tenantId, skip, take, search }: ListServicesArgs) {
    const where = {
      tenantId, // ← isolation
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.service.count({ where }),
    ]);

    return { items: rows.map(toDomain), total };
  }

  async findById(tenantId: string, id: string) {
    const row = await prisma.service.findFirst({ where: { id, tenantId } });
    return row ? toDomain(row) : null;
  }

  async findBySlug(tenantId: string, slug: string) {
    const row = await prisma.service.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    return row ? toDomain(row) : null;
  }

  async create(tenantId: string, data: CreateServiceData) {
    const row = await prisma.service.create({ data: { ...data, tenantId } });
    return toDomain(row);
  }

  async update(tenantId: string, id: string, data: UpdateServiceData) {
    // Scope the mutation to the tenant; never trust the id alone.
    const result = await prisma.service.updateMany({
      where: { id, tenantId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const result = await prisma.service.deleteMany({ where: { id, tenantId } });
    return result.count > 0;
  }
}

export const serviceRepository: ServiceRepository =
  new PrismaServiceRepository();
