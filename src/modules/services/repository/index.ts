import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

import type { Service, ServiceTranslations } from '../types';
import type { PriceMode, ServiceType } from '../validation';
import { resolveServiceText } from '../locale';

/**
 * Services · repository (tenant-scoped data access). EVERY method takes a
 * `tenantId` and filters by it (row-level isolation).
 *
 * All human text lives in the `translations` JSON (peer locales, no canonical
 * column). Reads accept an optional `locale` so the resolved `title`/
 * `description`/etc. on the returned domain object are in the caller's language.
 */

export interface ListServicesArgs {
  tenantId: string;
  skip: number;
  take: number;
  search?: string;
  locale?: string;
}

export interface CreateServiceData {
  categoryId?: string | null;
  type: ServiceType;
  slug: string;
  coverUrl?: string | null;
  thumbUrl?: string | null;
  priceMode: PriceMode;
  priceCents: number;
  currency: string;
  acceptedCurrencies: string[];
  requiresDate: boolean;
  minPeople?: number | null;
  maxPeople?: number | null;
  durationMinutes?: number | null;
  languages: string[];
  active: boolean;
  featured: boolean;
  /** Base name (neutral key) + price; localized names live in `translations`. */
  options: { name: string; priceDeltaCents: number }[];
  extras: { name: string; priceCents: number }[];
  /** Single source of truth for all localized text (>= 1 locale, keyed). */
  translations: ServiceTranslations;
}

/** Full update = the create shape; nested relations are rebuilt in place. */
export type UpdateServiceData = CreateServiceData;

const withRelations = {
  options: { orderBy: { sortOrder: 'asc' as const } },
  extras: { orderBy: { sortOrder: 'asc' as const } },
  media: { orderBy: { sortOrder: 'asc' as const } },
};

type ServiceRow = Prisma.ServiceGetPayload<{ include: typeof withRelations }>;

function toDomain(row: ServiceRow | Prisma.ServiceGetPayload<object>, locale?: string): Service {
  const r = row as ServiceRow;
  const translations = (r.translations as ServiceTranslations | null) ?? null;
  const text = resolveServiceText(translations, locale);
  return {
    id: r.id,
    tenantId: r.tenantId,
    categoryId: r.categoryId,
    type: r.type,
    slug: r.slug,
    title: text.title,
    subtitle: text.subtitle,
    description: text.description,
    tags: text.tags,
    coverUrl: r.coverUrl,
    thumbUrl: r.thumbUrl,
    priceMode: r.priceMode,
    priceCents: r.priceCents,
    currency: r.currency,
    acceptedCurrencies: r.acceptedCurrencies,
    priceUnit: text.priceUnit,
    requiresDate: r.requiresDate,
    minPeople: r.minPeople,
    maxPeople: r.maxPeople,
    durationMinutes: r.durationMinutes,
    languages: r.languages,
    active: r.active,
    featured: r.featured,
    ratingCached: r.ratingCached,
    reviewCount: r.reviewCountCached,
    included: text.included,
    info: text.info,
    options: (r.options ?? []).map((o, i) => ({
      name: text.optionName(i, o.name),
      priceDeltaCents: o.priceDeltaCents,
    })),
    extras: (r.extras ?? []).map((e, i) => ({
      name: text.extraName(i, e.name),
      priceCents: e.priceCents,
    })),
    media: (r.media ?? []).map((m) => ({ url: m.url, type: m.type, alt: m.alt })),
    translations,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/** Search across slug + the title of any stored locale (JSON path match). */
function searchWhere(search?: string): Prisma.ServiceWhereInput {
  if (!search) return {};
  return {
    OR: [
      { slug: { contains: search, mode: 'insensitive' } },
      { translations: { path: ['en', 'title'], string_contains: search } },
      { translations: { path: ['fr', 'title'], string_contains: search } },
    ],
  };
}

export const serviceRepository = {
  async findMany({ tenantId, skip, take, search, locale }: ListServicesArgs) {
    const where = { tenantId, ...searchWhere(search) };
    const [rows, total] = await Promise.all([
      prisma.service.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.service.count({ where }),
    ]);
    return { items: rows.map((r) => toDomain(r, locale)), total };
  },

  async findById(tenantId: string, id: string, locale?: string) {
    const row = await prisma.service.findFirst({
      where: { id, tenantId },
      include: withRelations,
    });
    return row ? toDomain(row, locale) : null;
  },

  async findBySlug(tenantId: string, slug: string, locale?: string) {
    const row = await prisma.service.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      include: withRelations,
    });
    return row ? toDomain(row, locale) : null;
  },

  /** Public catalog: active services only. */
  async findManyActive(args: {
    tenantId: string;
    skip: number;
    take: number;
    search?: string;
    locale?: string;
  }) {
    const where = { tenantId: args.tenantId, active: true, ...searchWhere(args.search) };
    const [rows, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip: args.skip,
        take: args.take,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.service.count({ where }),
    ]);
    return { items: rows.map((r) => toDomain(r, args.locale)), total };
  },

  /** Public detail: a single active service (with options/extras/media). */
  async findActiveBySlug(tenantId: string, slug: string, locale?: string) {
    const row = await prisma.service.findFirst({
      where: { tenantId, slug, active: true },
      include: withRelations,
    });
    return row ? toDomain(row, locale) : null;
  },

  async tenantIdBySlug(slug: string) {
    const t = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    return t && t.status === 'ACTIVE' ? t.id : null;
  },

  async create(tenantId: string, data: CreateServiceData): Promise<Service> {
    const { options, extras, categoryId, translations, ...scalars } = data;
    const row = await prisma.service.create({
      data: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
        ...scalars,
        translations: translations as unknown as Prisma.InputJsonValue,
        options: { create: options.map((o, i) => ({ ...o, sortOrder: i })) },
        extras: { create: extras.map((e, i) => ({ ...e, sortOrder: i })) },
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

    const { options, extras, categoryId, translations, ...scalars } = data;
    await prisma.$transaction([
      prisma.serviceOption.deleteMany({ where: { serviceId: id } }),
      prisma.serviceExtra.deleteMany({ where: { serviceId: id } }),
      prisma.service.update({
        where: { id },
        data: {
          ...scalars,
          categoryId: categoryId ?? null,
          translations: translations as unknown as Prisma.InputJsonValue,
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
