import { prisma } from '@/lib/db';
import type { Category as PrismaCategory } from '@prisma/client';
import type { Category } from '../types';

type WithParent = PrismaCategory & { parent: { name: string } | null };

function toDomain(c: WithParent): Category {
  return {
    id: c.id, tenantId: c.tenantId, parentId: c.parentId,
    parentName: c.parent?.name ?? null, slug: c.slug, name: c.name,
    description: c.description, imageUrl: c.imageUrl, sortOrder: c.sortOrder,
  };
}

export const categoryRepository = {
  /** Sole tenant fallback for a Super Admin with no active tenant. */
  async firstTenantId(): Promise<string | null> {
    const t = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
    return t?.id ?? null;
  },
  async findMany(args: { tenantId: string; skip: number; take: number; search?: string }) {
    const where = {
      tenantId: args.tenantId,
      ...(args.search ? { name: { contains: args.search, mode: 'insensitive' as const } } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.category.findMany({
        where, skip: args.skip, take: args.take,
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        include: { parent: { select: { name: true } } },
      }),
      prisma.category.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  },
  async findBySlug(tenantId: string, slug: string) {
    return prisma.category.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
  },
  async create(tenantId: string, data: { name: string; slug: string; parentId?: string | null; description?: string | null; imageUrl?: string | null }) {
    const row = await prisma.category.create({
      data: { tenantId, ...data },
      include: { parent: { select: { name: true } } },
    });
    return toDomain(row);
  },
  async update(
    tenantId: string,
    id: string,
    data: { name: string; slug: string; parentId?: string | null; description?: string | null; imageUrl?: string | null },
  ) {
    const exists = await prisma.category.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!exists) return null;
    const row = await prisma.category.update({
      where: { id },
      data,
      include: { parent: { select: { name: true } } },
    });
    return toDomain(row);
  },
  async remove(tenantId: string, id: string) {
    const r = await prisma.category.deleteMany({ where: { id, tenantId } });
    return r.count > 0;
  },
};
