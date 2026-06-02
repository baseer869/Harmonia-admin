import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

import { ApiError } from '@/lib/api';
import type { Reservation } from '../types';
import type { BookingItemInput } from '../validation';

export interface BookingResult {
  id: string;
  code: string;
  status: string;
  subtotalCents: number;
  totalCents: number;
  currency: string;
}

export const reservationRepository = {
  async findMany(args: { tenantId?: string; status?: Reservation['status']; skip: number; take: number }) {
    const where = {
      ...(args.tenantId ? { tenantId: args.tenantId } : {}),
      ...(args.status ? { status: args.status } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.reservation.findMany({
        where, skip: args.skip, take: args.take, orderBy: { createdAt: 'desc' },
        include: { customer: { select: { email: true } } },
      }),
      prisma.reservation.count({ where }),
    ]);
    const items: Reservation[] = rows.map((r) => ({
      id: r.id, tenantId: r.tenantId, code: r.code, status: r.status,
      totalCents: r.totalCents, currency: r.currency,
      customerEmail: r.customer?.email ?? null,
      scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));
    return { items, total };
  },

  async tenantIdBySlug(slug: string): Promise<string | null> {
    const t = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, status: true } });
    return t && t.status === 'ACTIVE' ? t.id : null;
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
          include: { options: true },
        });
        if (!svc) throw ApiError.badRequest('A selected service is unavailable.');
        currency = svc.currency;

        let unit = svc.priceCents;
        if (svc.priceMode === 'PER_PERSON') {
          unit = svc.priceCents * Math.max(1, it.people ?? 1);
        }
        if (it.optionName) {
          const opt = svc.options.find((o) => o.name === it.optionName);
          if (opt) unit += opt.priceDeltaCents;
        }
        const extrasTotal = (it.extras ?? []).reduce((s, e) => s + e.priceCents, 0);
        const lineUnit = unit + extrasTotal;
        subtotal += lineUnit * it.quantity;

        const when = it.scheduledAt ? new Date(it.scheduledAt) : null;
        if (when && !firstScheduledAt) firstScheduledAt = when;

        itemRows.push({
          serviceId: svc.id,
          title: svc.title,
          quantity: it.quantity,
          unitPriceCents: lineUnit,
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
