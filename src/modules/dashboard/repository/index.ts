import { prisma } from '@/lib/db';
import type { ChartPoint, DashboardStats } from '../types';

async function counts(where: { tenantId?: string }) {
  const [services, customers, reservations, pendingReservations, revenue] =
    await Promise.all([
      prisma.service.count({ where }),
      prisma.customer.count({ where }),
      prisma.reservation.count({ where }),
      prisma.reservation.count({ where: { ...where, status: 'PENDING' } }),
      prisma.payment.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amountCents: true },
      }),
    ]);
  return {
    services,
    customers,
    reservations,
    pendingReservations,
    revenueCents: revenue._sum.amountCents ?? 0,
  };
}

/** Reservations per month for the last `months` months. */
async function reservationsByMonth(tenantId: string | undefined, months = 6): Promise<ChartPoint[]> {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, idx) => {
    const i = months - 1 - idx;
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    return { start, end, label: start.toLocaleString('en', { month: 'short' }) };
  });
  const values = await Promise.all(
    buckets.map((b) =>
      prisma.reservation.count({
        where: { ...(tenantId ? { tenantId } : {}), createdAt: { gte: b.start, lt: b.end } },
      }),
    ),
  );
  return buckets.map((b, i) => ({ label: b.label, value: values[i] ?? 0 }));
}

export const dashboardRepository = {
  async platformStats(): Promise<DashboardStats> {
    const [tenants, rest, series] = await Promise.all([
      prisma.tenant.count(),
      counts({}),
      reservationsByMonth(undefined),
    ]);
    return { tenants, currency: 'MAD', series, ...rest };
  },
  async tenantStats(tenantId: string): Promise<DashboardStats> {
    const [rest, series] = await Promise.all([
      counts({ tenantId }),
      reservationsByMonth(tenantId),
    ]);
    return { currency: 'MAD', series, ...rest };
  },
};
