import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

import type {
  Service,
  ServiceIncluded,
  ServiceInfo,
} from '../types';
import type { PriceMode, ServiceType } from '../validation';

/**
 * Services · repository (tenant-scoped data access). EVERY method takes a
 * `tenantId` and filters by it (row-level isolation).
 */

export interface ListServicesArgs {
  tenantId: string;
  skip: number;
  take: number;
  search?: string;
}

export interface CreateServiceData {
  categoryId?: string | null;
  type: ServiceType;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  tags: string[];
  coverUrl?: string | null;
  thumbUrl?: string | null;
  priceMode: PriceMode;
  priceCents: number;
  currency: string;
  acceptedCurrencies: string[];
  priceUnit?: string | null;
  requiresDate: boolean;
  minPeople?: number | null;
  maxPeople?: number | null;
  durationMinutes?: number | null;
  languages: string[];
  active: boolean;
  featured: boolean;
  options: { name: string; priceDeltaCents: number }[];
  extras: { name: string; priceCents: number }[];
  included: ServiceIncluded[];
  info: ServiceInfo[];
}

/** Full update = the create shape; nested relations are rebuilt in place. */
export type UpdateServiceData = CreateServiceData;

const withRelations = {
  options: { orderBy: { sortOrder: 'asc' as const } },
  extras: { orderBy: { sortOrder: 'asc' as const } },
  media: { orderBy: { sortOrder: 'asc' as const } },
};

type ServiceRow = Prisma.ServiceGetPayload<{ include: typeof withRelations }>;

function toDomain(row: ServiceRow | Prisma.ServiceGetPayload<object>): Service {
  const r = row as ServiceRow;
  return {
    id: r.id,
    tenantId: r.tenantId,
    categoryId: r.categoryId,
    type: r.type,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    tags: r.tags,
    coverUrl: r.coverUrl,
    thumbUrl: r.thumbUrl,
    priceMode: r.priceMode,
    priceCents: r.priceCents,
    currency: r.currency,
    acceptedCurrencies: r.acceptedCurrencies,
    priceUnit: r.priceUnit,
    requiresDate: r.requiresDate,
    minPeople: r.minPeople,
    maxPeople: r.maxPeople,
    durationMinutes: r.durationMinutes,
    languages: r.languages,
    active: r.active,
    featured: r.featured,
    ratingCached: r.ratingCached,
    reviewCount: r.reviewCountCached,
    included: (r.includedJson as ServiceIncluded[] | null) ?? [],
    info: (r.infoJson as ServiceInfo[] | null) ?? [],
    options: (r.options ?? []).map((o) => ({
      name: o.name,
      priceDeltaCents: o.priceDeltaCents,
    })),
    extras: (r.extras ?? []).map((e) => ({
      name: e.name,
      priceCents: e.priceCents,
    })),
    media: (r.media ?? []).map((m) => ({ url: m.url, type: m.type, alt: m.alt })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export const serviceRepository = {
  async findMany({ tenantId, skip, take, search }: ListServicesArgs) {
    const where = {
      tenantId,
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
      prisma.service.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.service.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  },

  async findById(tenantId: string, id: string) {
    const row = await prisma.service.findFirst({
      where: { id, tenantId },
      include: withRelations,
    });
    return row ? toDomain(row) : null;
  },

  async findBySlug(tenantId: string, slug: string) {
    const row = await prisma.service.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      include: withRelations,
    });
    return row ? toDomain(row) : null;
  },

  /** Public catalog: active services only. */
  async findManyActive(args: { tenantId: string; skip: number; take: number; search?: string }) {
    const where = {
      tenantId: args.tenantId,
      active: true,
      ...(args.search
        ? { title: { contains: args.search, mode: 'insensitive' as const } }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip: args.skip,
        take: args.take,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.service.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  },

  /** Public detail: a single active service (with options/extras/media). */
  async findActiveBySlug(tenantId: string, slug: string) {
    const row = await prisma.service.findFirst({
      where: { tenantId, slug, active: true },
      include: withRelations,
    });
    return row ? toDomain(row) : null;
  },

  async tenantIdBySlug(slug: string) {
    const t = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    return t && t.status === 'ACTIVE' ? t.id : null;
  },

  async create(tenantId: string, data: CreateServiceData): Promise<Service> {
    const { options, extras, included, info, categoryId, ...scalars } = data;
    const row = await prisma.service.create({
      data: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
        ...scalars,
        includedJson: included as unknown as Prisma.InputJsonValue,
        infoJson: info as unknown as Prisma.InputJsonValue,
        options: {
          create: options.map((o, i) => ({ ...o, sortOrder: i })),
        },
        extras: {
          create: extras.map((e, i) => ({ ...e, sortOrder: i })),
        },
      },
      include: withRelations,
    });
    return toDomain(row);
  },

  async update(tenantId: string, id: string, data: UpdateServiceData): Promise<Service | null> {
    const exists = await prisma.service.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!exists) return null;

    const { options, extras, included, info, categoryId, ...scalars } = data;
    await prisma.$transaction([
      prisma.serviceOption.deleteMany({ where: { serviceId: id } }),
      prisma.serviceExtra.deleteMany({ where: { serviceId: id } }),
      prisma.service.update({
        where: { id },
        data: {
          ...scalars,
          categoryId: categoryId ?? null,
          includedJson: included as unknown as Prisma.InputJsonValue,
          infoJson: info as unknown as Prisma.InputJsonValue,
          options: { create: options.map((o, i) => ({ ...o, sortOrder: i })) },
          extras: { create: extras.map((e, i) => ({ ...e, sortOrder: i })) },
        },
      }),
    ]);
    return this.findById(tenantId, id);
  },

  async remove(tenantId: string, id: string) {
    const result = await prisma.service.deleteMany({ where: { id, tenantId } });
    return result.count > 0;
  },
};
