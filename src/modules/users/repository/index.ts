import { prisma } from '@/lib/db';
import type { User as PrismaUser } from '@prisma/client';

import type { AdminUser } from '../types';

export interface ListUsersArgs {
  tenantId?: string; // omit → all tenants (Super Admin)
  skip: number;
  take: number;
  search?: string;
}

export interface CreateUserData {
  tenantId: string | null;
  email: string;
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  passwordHash: string;
  role: AdminUser['role'];
}

function toDomain(u: PrismaUser): AdminUser {
  return {
    id: u.id,
    tenantId: u.tenantId,
    email: u.email,
    name: u.name,
    phone: u.phone,
    city: u.city,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  };
}

export const userRepository = {
  async findMany({ tenantId, skip, take, search }: ListUsersArgs) {
    const where = {
      ...(tenantId ? { tenantId } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { name: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  },

  async findByEmail(email: string) {
    const u = await prisma.user.findUnique({ where: { email } });
    return u ? toDomain(u) : null;
  },

  async create(data: CreateUserData) {
    const u = await prisma.user.create({ data });
    return toDomain(u);
  },

  async update(id: string, tenantScope: string | undefined, data: { name?: string; role?: AdminUser['role']; isActive?: boolean }) {
    // tenantScope limits tenant admins to their own users.
    const result = await prisma.user.updateMany({
      where: { id, ...(tenantScope ? { tenantId: tenantScope } : {}) },
      data,
    });
    if (result.count === 0) return null;
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? toDomain(u) : null;
  },
};
