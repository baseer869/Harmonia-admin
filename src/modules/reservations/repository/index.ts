import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

import { ApiError } from '@/lib/api';
import { resolveServiceText } from '@/modules/services/locale';
import type { ServiceTranslations } from '@/modules/services/types';
import type { Reservation, ReservationDetail, ReservationItemDetail } from '../types';
import type { BookingItemInput } from '../validation';

type ExtrasJson = { name: string; priceCents: number; qty?: number }[];

function summarize(items: { title: string }[]): string {
  const first = items[0];
  if (!first) return '—';
  const rest = items.length - 1;
  return rest > 0 ? `${first.title} +${rest}` : first.title;
}

export interface BookingResult {
  id: string;
  code: string;
  status: string;
  subtotalCents: number;
  totalCents: number;
  currency: string;
}

export const reservationRepository = {
  async findMany(args: {
    tenantId?: string;
    status?: Reservation['status'];
    search?: string;
    skip: number;
    take: number;
  }) {
    const mode = 'insensitive' as const;
    const where: Prisma.ReservationWhereInput = {
      ...(args.tenantId ? { tenantId: args.tenantId } : {}),
      ...(args.status ? { status: args.status } : {}),
      ...(args.search
        ? {
            OR: [
              { code: { contains: args.search, mode } },
              { customer: { name: { contains: args.search, mode } } },
              { customer: { email: { contains: args.search, mode } } },
              { customer: { phone: { contains: args.search, mode } } },
              { items: { some: { title: { contains: args.search, mode } } } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.reservation.findMany({
        where, skip: args.skip, take: args.take, orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: { select: { title: true } },
        },
      }),
      prisma.reservation.count({ where }),
    ]);
    const items: Reservation[] = rows.map((r) => ({
      id: r.id, tenantId: r.tenantId, code: r.code, status: r.status,
      totalCents: r.totalCents, currency: r.currency,
      customerName: r.customer?.name ?? null,
      customerEmail: r.customer?.email ?? null,
      customerPhone: r.customer?.phone ?? null,
      itemsCount: r.items.length,
      itemsSummary: summarize(r.items),
      scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));
    return { items, total };
  },

  /** Full booking detail (customer + line items) for the admin view. */
  async findById(tenantId: string | undefined, id: string): Promise<ReservationDetail | null> {
    const r = await prisma.reservation.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        customer: { select: { name: true, email: true, phone: true, city: true } },
        items: { orderBy: { id: 'asc' } },
      },
    });
    if (!r) return null;
    const items: ReservationItemDetail[] = r.items.map((it) => ({
      title: it.title,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
      scheduledAt: it.scheduledAt ? it.scheduledAt.toISOString() : null,
      extras: (it.extrasJson as ExtrasJson | null) ?? [],
    }));
    return {
      id: r.id, tenantId: r.tenantId, code: r.code, status: r.status,
      totalCents: r.totalCents, subtotalCents: r.subtotalCents, discountCents: r.discountCents,
      currency: r.currency, notes: r.notes,
      customerName: r.customer?.name ?? null,
      customerEmail: r.customer?.email ?? null,
      customerPhone: r.customer?.phone ?? null,
      customerCity: r.customer?.city ?? null,
      itemsCount: items.length,
      itemsSummary: summarize(items),
      scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      items,
    };
  },

  /** Update a booking's status (tenant-scoped). Returns the refreshed detail. */
  async updateStatus(
    tenantId: string | undefined,
    id: string,
    status: Reservation['status'],
  ): Promise<ReservationDetail | null> {
    const res = await prisma.reservation.updateMany({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      data: { status },
    });
    if (res.count === 0) return null;
    return this.findById(tenantId, id);
  },

  async tenantIdBySlug(slug: string): Promise<string | null> {
    const t = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, status: true } });
    return t && t.status === 'ACTIVE' ? t.id : null;
  },

  /** The tenant that owns an active service (marketplace booking resolution). */
  async tenantIdOfService(serviceId: string): Promise<string | null> {
    const s = await prisma.service.findFirst({
      where: { id: serviceId, active: true, tenant: { status: 'ACTIVE' } },
      select: { tenantId: true },
    });
    return s?.tenantId ?? null;
  },

  /** Find an existing customer (by tenant+email) or create a guest one. */
  async findOrCreateCustomer(
    tenantId: string,
    contact: { name?: string; email: string; phone?: string },
  ): Promise<string> {
    const existing = await prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email: contact.email } },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await prisma.customer.create({
      data: { tenantId, email: contact.email, name: contact.name ?? null, phone: contact.phone ?? null },
      select: { id: true },
    });
    return created.id;
  },

  /**
   * Create a booking (Reservation + items) in one transaction. Prices are
   * computed server-side from each Service (never trusted from the client).
   */
  async createBooking(
    tenantId: string,
    customerId: string,
    items: BookingItemInput[],
    notes?: string,
    locale = 'fr',
  ): Promise<BookingResult> {
    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let currency = 'MAD';
      let firstScheduledAt: Date | null = null;

      const itemRows = [] as {
        serviceId: string;
        title: string;
        quantity: number;
        unitPriceCents: number;
        scheduledAt: Date | null;
        extrasJson: Prisma.InputJsonValue;
      }[];

      for (const it of items) {
        const svc = await tx.service.findFirst({
          where: { id: it.serviceId, tenantId, active: true },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        });
        if (!svc) throw ApiError.badRequest('A selected service is unavailable.');
        currency = svc.currency;
        const text = resolveServiceText(svc.translations as ServiceTranslations | null, locale);

        // Pricing model: the customer buys ONE package at an absolute price (the
        // base price IS the default "Base" package). A single count (quantity =
        // people for per-person services, or units otherwise) multiplies ONLY the
        // package. Add-ons are flat — each priced × its own counter, never × count.
        let packageCents = svc.priceCents; // Base package
        if (it.optionName) {
          // The client may send the package name in the customer's language —
          // match against both the base name and the localized name by index.
          const opt = svc.options.find(
            (o, i) => o.name === it.optionName || text.optionName(i, o.name) === it.optionName,
          );
          if (opt) packageCents = opt.priceDeltaCents; // absolute package price
        }
        const addonsTotal = (it.extras ?? []).reduce(
          (s, e) => s + e.priceCents * Math.max(1, e.qty ?? 1),
          0,
        );
        // package × count (quantity) + add-ons (added once).
        subtotal += packageCents * it.quantity + addonsTotal;

        const when = it.scheduledAt ? new Date(it.scheduledAt) : null;
        if (when && !firstScheduledAt) firstScheduledAt = when;

        // Snapshot the title in the booking's language (peer translations, with
        // fallback to any other available locale).
        const title = text.title || 'Service';

        itemRows.push({
          serviceId: svc.id,
          title,
          quantity: it.quantity,
          // Per-unit = the package price; add-ons are listed separately in
          // extrasJson and added once to the booking total.
          unitPriceCents: packageCents,
          scheduledAt: when,
          extrasJson: (it.extras ?? []) as unknown as Prisma.InputJsonValue,
        });
      }

      const code = `BK-${Date.now().toString(36).toUpperCase()}`;
      const reservation = await tx.reservation.create({
        data: {
          tenantId,
          customerId,
          code,
          locale,
          status: 'PENDING',
          subtotalCents: subtotal,
          totalCents: subtotal,
          currency,
          scheduledAt: firstScheduledAt,
          notes: notes ?? null,
          items: { create: itemRows },
        },
        select: { id: true, code: true, status: true, subtotalCents: true, totalCents: true, currency: true },
      });

      return reservation;
    });
  },
};
