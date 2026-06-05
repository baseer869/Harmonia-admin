import { prisma } from '@/lib/db';
import { Prisma, type OwnerRequest as PrismaOwnerRequest } from '@prisma/client';

import type { OwnerRequest, OwnerRequestStatus } from '../types';
import type { CreateOwnerRequestInput } from '../validation';

function toDomain(r: PrismaOwnerRequest): OwnerRequest {
  return {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    company: r.company,
    role: r.role,
    subject: r.subject,
    message: r.message,
    status: r.status,
    tenantId: r.tenantId,
    locale: r.locale,
    createdAt: r.createdAt.toISOString(),
  };
}

export const ownerRequestRepository = {
  async findMany(args: {
    status?: OwnerRequestStatus;
    search?: string;
    skip: number;
    take: number;
  }) {
    const mode = 'insensitive' as const;
    const where: Prisma.OwnerRequestWhereInput = {
      ...(args.status ? { status: args.status } : {}),
      ...(args.search
        ? {
            OR: [
              { firstName: { contains: args.search, mode } },
              { lastName: { contains: args.search, mode } },
              { email: { contains: args.search, mode } },
              { company: { contains: args.search, mode } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.ownerRequest.findMany({
        where,
        skip: args.skip,
        take: args.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ownerRequest.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  },

  async create(data: CreateOwnerRequestInput): Promise<OwnerRequest> {
    const r = await prisma.ownerRequest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName ?? null,
        email: data.email,
        phone: data.phone ?? null,
        company: data.company ?? null,
        role: data.role ?? null,
        subject: data.subject ?? null,
        message: data.message ?? null,
        locale: data.locale ?? 'fr',
      },
    });
    return toDomain(r);
  },

  async updateStatus(id: string, status: OwnerRequestStatus): Promise<OwnerRequest | null> {
    const r = await prisma.ownerRequest
      .update({ where: { id }, data: { status } })
      .catch(() => null);
    return r ? toDomain(r) : null;
  },
};
