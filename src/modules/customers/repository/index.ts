import { prisma } from '@/lib/db';
import type { Customer as PrismaCustomer } from '@prisma/client';
import type { Customer } from '../types';

function toDomain(c: PrismaCustomer): Customer {
  return {
    id: c.id,
    tenantId: c.tenantId,
    email: c.email,
    name: c.name,
    phone: c.phone,
    city: c.city,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

export const customerRepository = {
  async findMany(args: { tenantId?: string; skip: number; take: number; search?: string }) {
    const where = {
      ...(args.tenantId ? { tenantId: args.tenantId } : {}),
      ...(args.search
        ? {
            OR: [
              { email: { contains: args.search, mode: 'insensitive' as const } },
              { name: { contains: args.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: args.skip,
        take: args.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  },

  async setStatus(tenantId: string | undefined, id: string, status: 'ACTIVE' | 'BLOCKED') {
    const result = await prisma.customer.updateMany({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      data: { status },
    });
    if (result.count === 0) return null;
    const c = await prisma.customer.findUnique({ where: { id } });
    return c ? toDomain(c) : null;
  },
};
